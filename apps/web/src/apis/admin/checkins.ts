import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import {
  formatTicketEligibilitySummary,
  loadCheckinTypeTicketEligibility,
} from '@base/core/business.server/events/checkin-type-ticket-eligibility';
import {
  CheckinRecordsTable,
  CheckinTypeTicketTypesTable,
  CheckinTypesTable,
  TicketTypesTable,
} from '@base/core/business.server/events/schemas/schema';
import { CheckinTypeCategoryCodes } from '@base/core/config/constant';
import { asc, count, db, eq, inArray } from '@base/core/drizzle.server';

import { requireAdmin } from '~/apis/auth';

export type CheckinTypeListItem = {
  id: string;
  name: string;
  type: (typeof CheckinTypesTable.$inferSelect)['type'];
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  allowedTicketTypeIds: string[];
  allowedTicketTypeNames: string[];
  ticketEligibilitySummary: string;
};

export const listCheckinTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const checkinTypes = await db.select().from(CheckinTypesTable).orderBy(asc(CheckinTypesTable.displayOrder));

  const eligibility = await loadCheckinTypeTicketEligibility(db, checkinTypes.map((t) => t.id));

  const list: CheckinTypeListItem[] = checkinTypes.map((t) => {
    const e = eligibility.get(t.id);
    const linkedTicketTypeIds = e?.linkedTicketTypeIds ?? [];
    const activeTicketTypeNames = e?.activeTicketTypeNames ?? [];
    const linkCount = e?.linkCount ?? 0;
    return {
      ...t,
      allowedTicketTypeIds: linkedTicketTypeIds,
      allowedTicketTypeNames: activeTicketTypeNames,
      ticketEligibilitySummary: formatTicketEligibilitySummary(linkCount, activeTicketTypeNames),
    };
  });

  return { checkinTypes: list };
});

const createCheckinTypeInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(CheckinTypeCategoryCodes),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean().default(true),
  allowedTicketTypeIds: z.array(z.string()).optional(),
});

export type CreateCheckinTypeInput = z.infer<typeof createCheckinTypeInputSchema>;

export const createCheckinType = createServerFn({ method: 'POST' })
  .validator((data: CreateCheckinTypeInput) => createCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const existing = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.name, data.name),
    });

    if (existing) {
      throw new Error('Check-in type with this name already exists');
    }

    const { allowedTicketTypeIds, ...checkinValues } = data;

    const newCheckinType = await db.transaction(async (tx) => {
      const [created] = await tx.insert(CheckinTypesTable).values(checkinValues).returning();

      if (allowedTicketTypeIds?.length) {
        const validIds = await tx
          .select({ id: TicketTypesTable.id })
          .from(TicketTypesTable)
          .where(inArray(TicketTypesTable.id, allowedTicketTypeIds));

        const idSet = new Set(validIds.map((r) => r.id));
        const unknown = allowedTicketTypeIds.filter((tid) => !idSet.has(tid));
        if (unknown.length > 0) {
          throw new Error(`Unknown ticket type id(s): ${unknown.join(', ')}`);
        }

        await tx.insert(CheckinTypeTicketTypesTable).values(
          allowedTicketTypeIds.map((ticketTypeId) => ({
            checkinTypeId: created.id,
            ticketTypeId,
          }))
        );
      }

      return created;
    });

    const eligibility = await loadCheckinTypeTicketEligibility(db, [newCheckinType.id]);
    const links = eligibility.get(newCheckinType.id);

    return {
      checkinType: {
        ...newCheckinType,
        allowedTicketTypeIds: links?.linkedTicketTypeIds ?? [],
        allowedTicketTypeNames: links?.activeTicketTypeNames ?? [],
        ticketEligibilitySummary: formatTicketEligibilitySummary(
          links?.linkCount ?? 0,
          links?.activeTicketTypeNames ?? []
        ),
      } satisfies CheckinTypeListItem,
    };
  });

const updateCheckinTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').optional(),
  type: z.enum(CheckinTypeCategoryCodes).optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  allowedTicketTypeIds: z.array(z.string()).optional(),
});

export type UpdateCheckinTypeInput = z.infer<typeof updateCheckinTypeInputSchema>;

export const updateCheckinType = createServerFn({ method: 'POST' })
  .validator((data: UpdateCheckinTypeInput) => updateCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id, allowedTicketTypeIds, ...updateData } = data;

    if (updateData.name) {
      const existing = await db.query.checkinTypes.findFirst({
        where: eq(CheckinTypesTable.name, updateData.name),
      });

      if (existing && existing.id !== id) {
        throw new Error('Check-in type with this name already exists');
      }
    }

    let updatedCheckinType = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.id, id),
    });

    if (!updatedCheckinType) {
      throw new Error('Check-in type not found');
    }

    if (Object.keys(updateData).length > 0 || allowedTicketTypeIds !== undefined) {
      await db.transaction(async (tx) => {
        if (Object.keys(updateData).length > 0) {
          const [row] = await tx
            .update(CheckinTypesTable)
            .set(updateData)
            .where(eq(CheckinTypesTable.id, id))
            .returning();
          if (row) {
            updatedCheckinType = row;
          }
        }

        if (allowedTicketTypeIds !== undefined) {
          if (allowedTicketTypeIds.length > 0) {
            const validIds = await tx
              .select({ id: TicketTypesTable.id })
              .from(TicketTypesTable)
              .where(inArray(TicketTypesTable.id, allowedTicketTypeIds));

            const idSet = new Set(validIds.map((r) => r.id));
            const unknown = allowedTicketTypeIds.filter((tid) => !idSet.has(tid));
            if (unknown.length > 0) {
              throw new Error(`Unknown ticket type id(s): ${unknown.join(', ')}`);
            }
          }

          await tx
            .delete(CheckinTypeTicketTypesTable)
            .where(eq(CheckinTypeTicketTypesTable.checkinTypeId, id));

          if (allowedTicketTypeIds.length > 0) {
            await tx.insert(CheckinTypeTicketTypesTable).values(
              allowedTicketTypeIds.map((ticketTypeId) => ({
                checkinTypeId: id,
                ticketTypeId,
              }))
            );
          }
        }
      });
    }

    const latest = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.id, id),
    });
    if (latest) {
      updatedCheckinType = latest;
    }

    const eligibility = await loadCheckinTypeTicketEligibility(db, [id]);
    const links = eligibility.get(id);

    return {
      checkinType: {
        ...updatedCheckinType,
        allowedTicketTypeIds: links?.linkedTicketTypeIds ?? [],
        allowedTicketTypeNames: links?.activeTicketTypeNames ?? [],
        ticketEligibilitySummary: formatTicketEligibilitySummary(
          links?.linkCount ?? 0,
          links?.activeTicketTypeNames ?? []
        ),
      } satisfies CheckinTypeListItem,
    };
  });

const toggleCheckinTypeActiveInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type ToggleCheckinTypeActiveInput = z.infer<typeof toggleCheckinTypeActiveInputSchema>;

export const toggleCheckinTypeActive = createServerFn({ method: 'POST' })
  .validator((data: ToggleCheckinTypeActiveInput) => toggleCheckinTypeActiveInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const checkinType = await db.query.checkinTypes.findFirst({
      where: eq(CheckinTypesTable.id, data.id),
    });

    if (!checkinType) {
      throw new Error('Check-in type not found');
    }

    const [updatedCheckinType] = await db
      .update(CheckinTypesTable)
      .set({ isActive: !checkinType.isActive })
      .where(eq(CheckinTypesTable.id, data.id))
      .returning();

    if (!updatedCheckinType) {
      throw new Error('Check-in type not found');
    }

    return { checkinType: updatedCheckinType };
  });

const deleteCheckinTypeInputSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type DeleteCheckinTypeInput = z.infer<typeof deleteCheckinTypeInputSchema>;

export const deleteCheckinType = createServerFn({ method: 'POST' })
  .validator((data: DeleteCheckinTypeInput) => deleteCheckinTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const recordCount = await db
      .select({ count: count() })
      .from(CheckinRecordsTable)
      .where(eq(CheckinRecordsTable.checkinTypeId, data.id));

    const countValue = recordCount[0]?.count ?? 0;

    if (countValue > 0) {
      throw new Error(`Cannot delete check-in type: ${countValue} check-in record(s) exist`);
    }

    const [deletedCheckinType] = await db
      .delete(CheckinTypesTable)
      .where(eq(CheckinTypesTable.id, data.id))
      .returning();

    if (!deletedCheckinType) {
      throw new Error('Check-in type not found');
    }

    return { checkinType: deletedCheckinType };
  });
