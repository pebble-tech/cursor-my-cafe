import { createServerFn } from '@tanstack/react-start';
import cuid from 'cuid';
import { z } from 'zod';

import { UsersTable } from '@base/core/auth/schema';
import { generateQRCodeValue } from '@base/core/business.server/events/events';
import {
  buildImportParticipantUpdate,
  buildTicketTypeLookupMaps,
  importEmailGroupMergeConflicts,
  resolveTicketTypeIdForImport,
} from '@base/core/business.server/events/participant-import';
import {
  CheckinRecordsTable,
  CheckinTypesTable,
  TicketTypesTable,
} from '@base/core/business.server/events/schemas/schema';
import {
  ParticipantStatusCodes,
  ParticipantStatusEnum,
  ParticipantTypeCodes,
  ParticipantTypeEnum,
  UserRoleCodes,
  UserRoleEnum,
  UserTypeCodes,
  UserTypeEnum,
  type ParticipantType,
  type UserRole,
} from '@base/core/config/constant';
import { and, asc, count, db, desc, eq, ilike, inArray, or, type SQL } from '@base/core/drizzle.server';

import { requireAdmin } from '~/apis/auth';

const listParticipantsInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(ParticipantStatusCodes).optional(),
  participantType: z.enum(ParticipantTypeCodes).optional(),
  role: z.enum(UserRoleCodes).optional(),
  sortBy: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ListParticipantsInput = z.infer<typeof listParticipantsInputSchema>;

export const listParticipants = createServerFn({ method: 'GET' })
  .validator((data: ListParticipantsInput) => listParticipantsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { page, pageSize, search, status, participantType, role, sortBy, sortOrder } = data;
    const offset = (page - 1) * pageSize;

    const conditions: SQL[] = [];

    if (search) {
      const searchPattern = `%${search}%`;
      const searchCondition = or(ilike(UsersTable.name, searchPattern), ilike(UsersTable.email, searchPattern));
      if (searchCondition) conditions.push(searchCondition);
    }

    if (status) {
      conditions.push(eq(UsersTable.status, status));
    }

    if (participantType) {
      conditions.push(eq(UsersTable.participantType, participantType));
    }

    if (role) {
      conditions.push(eq(UsersTable.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumn = {
      name: UsersTable.name,
      email: UsersTable.email,
      createdAt: UsersTable.createdAt,
    }[sortBy];

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [users, totalResult] = await Promise.all([
      db
        .select({
          id: UsersTable.id,
          name: UsersTable.name,
          email: UsersTable.email,
          role: UsersTable.role,
          participantType: UsersTable.participantType,
          status: UsersTable.status,
          createdAt: UsersTable.createdAt,
          checkedInAt: UsersTable.checkedInAt,
          ticketTypeId: UsersTable.ticketTypeId,
          ticketTypeName: TicketTypesTable.name,
        })
        .from(UsersTable)
        .leftJoin(TicketTypesTable, eq(UsersTable.ticketTypeId, TicketTypesTable.id))
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: count() }).from(UsersTable).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  });

const createUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  userType: z.enum(UserTypeCodes),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createUser = createServerFn({ method: 'POST' })
  .validator((data: CreateUserInput) => createUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { name, email, userType } = data;
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await db.query.users.findFirst({
      where: eq(UsersTable.email, normalizedEmail),
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const userId = cuid();
    const qrCodeValue = generateQRCodeValue(userId);

    let role: UserRole = UserRoleEnum.participant;
    let participantType: ParticipantType = ParticipantTypeEnum.regular;

    if (userType === UserTypeEnum.vip) {
      participantType = ParticipantTypeEnum.vip;
    } else if (userType === UserTypeEnum.ops) {
      role = UserRoleEnum.ops;
    } else if (userType === UserTypeEnum.admin) {
      role = UserRoleEnum.admin;
    } else if (userType === UserTypeEnum.regular) {
      role = UserRoleEnum.participant;
      participantType = ParticipantTypeEnum.regular;
    }

    const [newUser] = await db
      .insert(UsersTable)
      .values({
        id: userId,
        name,
        email: normalizedEmail,
        emailVerified: false,
        role,
        participantType,
        status: ParticipantStatusEnum.registered,
        qrCodeValue,
      })
      .returning();

    return { user: newUser };
  });

const importParticipantsInputSchema = z.object({
  participants: z.array(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      lumaId: z.string().optional(),
      userType: z.enum(UserTypeCodes).default('regular'),
      ticketLumaTypeId: z.string().optional(),
      ticketName: z.string().optional(),
    })
  ),
});

export type ImportParticipantsInput = z.infer<typeof importParticipantsInputSchema>;

type SkippedRow = {
  row: number;
  email: string;
  reason: string;
};

export const importParticipants = createServerFn({ method: 'POST' })
  .validator((data: ImportParticipantsInput) => importParticipantsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { participants } = data;

    if (participants.length === 0) {
      return { inserted: 0, updated: 0, skipped: [] as SkippedRow[] };
    }

    const ticketTypeRows = await db
      .select({
        id: TicketTypesTable.id,
        name: TicketTypesTable.name,
        lumaTicketTypeId: TicketTypesTable.lumaTicketTypeId,
      })
      .from(TicketTypesTable);

    const { byLumaId, byName } = buildTicketTypeLookupMaps(ticketTypeRows);

    type CanonicalRow = (typeof participants)[number] & {
      ticketTypeId: string | null;
      rowNumbers: number[];
    };

    const emailToCanonical = new Map<string, CanonicalRow>();
    const skipped: SkippedRow[] = [];

    const groupedByEmail = new Map<string, Array<{ rowNumber: number; p: (typeof participants)[number] }>>();
    participants.forEach((p, index) => {
      const normalizedEmail = p.email.toLowerCase().trim();
      const arr = groupedByEmail.get(normalizedEmail) ?? [];
      arr.push({ rowNumber: index + 1, p });
      groupedByEmail.set(normalizedEmail, arr);
    });

    for (const [normalizedEmail, group] of groupedByEmail.entries()) {
      const userTypes = new Set(group.map((g) => g.p.userType));
      if (userTypes.size > 1) {
        for (const g of group) {
          skipped.push({
            row: g.rowNumber,
            email: normalizedEmail,
            reason: 'Conflicting user_type for same email in import file',
          });
        }
        continue;
      }

      const resolutions = group.map((g) => ({
        rowNumber: g.rowNumber,
        participant: g.p,
        ...resolveTicketTypeIdForImport(g.p, byLumaId, byName),
      }));

      if (resolutions.some((r) => r.error)) {
        for (const r of resolutions) {
          skipped.push({
            row: r.rowNumber,
            email: normalizedEmail,
            reason: r.error ?? 'Invalid ticket data for this email in import file',
          });
        }
        continue;
      }

      const merge = importEmailGroupMergeConflicts(resolutions);
      if (!merge.ok) {
        for (const r of resolutions) {
          skipped.push({
            row: r.rowNumber,
            email: normalizedEmail,
            reason: merge.reason,
          });
        }
        continue;
      }

      const first = resolutions[0];
      const ticketTypeId = first.ticketTypeId;

      emailToCanonical.set(normalizedEmail, {
        ...first.participant,
        ticketTypeId,
        rowNumbers: resolutions.map((r) => r.rowNumber),
      });
    }

    const canonicalList = [...emailToCanonical.values()];

    if (canonicalList.length === 0) {
      return { inserted: 0, updated: 0, skipped };
    }

    const emails = canonicalList.map((c) => c.email.toLowerCase().trim());

    const existingUsers = await db
      .select({
        id: UsersTable.id,
        email: UsersTable.email,
        role: UsersTable.role,
        name: UsersTable.name,
        lumaId: UsersTable.lumaId,
        ticketTypeId: UsersTable.ticketTypeId,
      })
      .from(UsersTable)
      .where(inArray(UsersTable.email, emails));

    const existingByEmail = new Map(existingUsers.map((u) => [u.email, u]));

    const toInsert: (typeof UsersTable.$inferInsert)[] = [];
    const toUpdate: Array<{
      id: string;
      name: string;
      lumaId: string | null;
      ticketTypeId: string | null;
    }> = [];

    canonicalList.forEach((c) => {
      const normalizedEmail = c.email.toLowerCase().trim();
      const existing = existingByEmail.get(normalizedEmail);

      let role: UserRole = UserRoleEnum.participant;
      let participantType: ParticipantType = ParticipantTypeEnum.regular;

      if (c.userType === UserTypeEnum.vip) {
        participantType = ParticipantTypeEnum.vip;
      } else if (c.userType === UserTypeEnum.ops) {
        role = UserRoleEnum.ops;
      } else if (c.userType === UserTypeEnum.admin) {
        role = UserRoleEnum.admin;
      } else if (c.userType === UserTypeEnum.regular) {
        role = UserRoleEnum.participant;
        participantType = ParticipantTypeEnum.regular;
      }

      if (existing) {
        if (existing.role !== UserRoleEnum.participant) {
          for (const rowNum of c.rowNumbers) {
            skipped.push({
              row: rowNum,
              email: normalizedEmail,
              reason: 'Email already belongs to a non-participant account',
            });
          }
          return;
        }
        const nextLumaId = c.lumaId?.trim() ? c.lumaId.trim() : (existing.lumaId ?? null);
        const update = buildImportParticipantUpdate(
          {
            name: existing.name,
            lumaId: existing.lumaId,
            ticketTypeId: existing.ticketTypeId,
          },
          {
            id: existing.id,
            name: c.name,
            lumaId: nextLumaId,
            ticketTypeId: c.ticketTypeId,
          }
        );
        if (update) {
          toUpdate.push(update);
        }
        return;
      }

      const userId = cuid();
      const qrCodeValue = generateQRCodeValue(userId);

      toInsert.push({
        id: userId,
        name: c.name,
        email: normalizedEmail,
        emailVerified: false,
        role,
        participantType,
        status: ParticipantStatusEnum.registered,
        lumaId: c.lumaId?.trim() ? c.lumaId.trim() : null,
        qrCodeValue,
        ticketTypeId: c.ticketTypeId,
      });
    });

    let inserted = 0;
    let updated = 0;

    await db.transaction(async (tx) => {
      if (toInsert.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const batch = toInsert.slice(i, i + batchSize);
          await tx.insert(UsersTable).values(batch);
          inserted += batch.length;
        }
      }

      for (const u of toUpdate) {
        await tx
          .update(UsersTable)
          .set({
            name: u.name,
            lumaId: u.lumaId,
            ticketTypeId: u.ticketTypeId,
          })
          .where(eq(UsersTable.id, u.id));
        updated += 1;
      }
    });

    return {
      inserted,
      updated,
      skipped,
    };
  });

const updateUserInputSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(UserRoleCodes).optional(),
  participantType: z.enum(ParticipantTypeCodes).optional(),
  status: z.enum(ParticipantStatusCodes).optional(),
  ticketTypeId: z.string().nullable().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateUser = createServerFn({ method: 'POST' })
  .validator((data: UpdateUserInput) => updateUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id, name, email, role, participantType, status, ticketTypeId } = data;

    const existing = await db.query.users.findFirst({
      where: eq(UsersTable.id, id),
    });

    if (!existing) {
      throw new Error('User not found');
    }

    const updateData: Partial<typeof UsersTable.$inferInsert> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== existing.email) {
        const emailExists = await db.query.users.findFirst({
          where: eq(UsersTable.email, normalizedEmail),
        });
        if (emailExists) {
          throw new Error('Email already registered');
        }
        updateData.email = normalizedEmail;
      }
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (participantType !== undefined) {
      updateData.participantType = participantType;
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (ticketTypeId !== undefined) {
      if (ticketTypeId === null) {
        updateData.ticketTypeId = null;
      } else {
        const tt = await db.query.ticketTypes.findFirst({
          where: eq(TicketTypesTable.id, ticketTypeId),
        });
        if (!tt) {
          throw new Error('Ticket type not found');
        }
        updateData.ticketTypeId = ticketTypeId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return { user: existing };
    }

    const [updatedUser] = await db.update(UsersTable).set(updateData).where(eq(UsersTable.id, id)).returning();

    return { user: updatedUser };
  });

const deleteUserInputSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

export const deleteUser = createServerFn({ method: 'POST' })
  .validator((data: DeleteUserInput) => deleteUserInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id } = data;

    const existing = await db.query.users.findFirst({
      where: eq(UsersTable.id, id),
    });

    if (!existing) {
      throw new Error('User not found');
    }

    await db.delete(UsersTable).where(eq(UsersTable.id, id));

    return { success: true };
  });

const getParticipantCheckinLogsInputSchema = z.object({
  participantId: z.string().min(1, 'Participant ID is required'),
});

export type GetParticipantCheckinLogsInput = z.infer<typeof getParticipantCheckinLogsInputSchema>;

export const getParticipantCheckinLogs = createServerFn({ method: 'GET' })
  .validator((data: GetParticipantCheckinLogsInput) => getParticipantCheckinLogsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { participantId } = data;

    const checkedInByUser = db
      .$with('checked_in_by_user')
      .as(db.select({ id: UsersTable.id, name: UsersTable.name }).from(UsersTable));

    const records = await db
      .with(checkedInByUser)
      .select({
        checkinTypeName: CheckinTypesTable.name,
        checkedInByName: checkedInByUser.name,
        checkedInAt: CheckinRecordsTable.checkedInAt,
      })
      .from(CheckinRecordsTable)
      .innerJoin(CheckinTypesTable, eq(CheckinRecordsTable.checkinTypeId, CheckinTypesTable.id))
      .innerJoin(checkedInByUser, eq(CheckinRecordsTable.checkedInBy, checkedInByUser.id))
      .where(eq(CheckinRecordsTable.participantId, participantId))
      .orderBy(desc(CheckinRecordsTable.checkedInAt))
      .limit(50);

    return { records };
  });

const getOpsActivityLogsInputSchema = z.object({
  opsUserId: z.string().min(1, 'Ops user ID is required'),
});

export type GetOpsActivityLogsInput = z.infer<typeof getOpsActivityLogsInputSchema>;

export const getOpsActivityLogs = createServerFn({ method: 'GET' })
  .validator((data: GetOpsActivityLogsInput) => getOpsActivityLogsInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { opsUserId } = data;

    const participantUser = db
      .$with('participant_user')
      .as(db.select({ id: UsersTable.id, name: UsersTable.name, email: UsersTable.email }).from(UsersTable));

    const records = await db
      .with(participantUser)
      .select({
        participantName: participantUser.name,
        participantEmail: participantUser.email,
        checkinTypeName: CheckinTypesTable.name,
        checkedInAt: CheckinRecordsTable.checkedInAt,
      })
      .from(CheckinRecordsTable)
      .innerJoin(CheckinTypesTable, eq(CheckinRecordsTable.checkinTypeId, CheckinTypesTable.id))
      .innerJoin(participantUser, eq(CheckinRecordsTable.participantId, participantUser.id))
      .where(eq(CheckinRecordsTable.checkedInBy, opsUserId))
      .orderBy(desc(CheckinRecordsTable.checkedInAt))
      .limit(50);

    return { records };
  });
