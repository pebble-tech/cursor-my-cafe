import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { UsersTable } from '@base/core/auth/schema';
import {
  CheckinTypeTicketTypesTable,
  TicketTypesTable,
} from '@base/core/business.server/events/schemas/schema';
import { rethrowTicketTypeUniqueViolation } from '@base/core/db/postgres-errors';
import { asc, count, db, eq } from '@base/core/drizzle.server';

import { requireAdmin } from '~/apis/auth';

export const listTicketTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const ticketTypes = await db.select().from(TicketTypesTable).orderBy(asc(TicketTypesTable.code));

  return { ticketTypes };
});

const createTicketTypeInputSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  lumaTicketTypeId: z.string().min(1, 'Luma ticket type ID is required'),
  isActive: z.boolean().default(true),
});

export type CreateTicketTypeInput = z.infer<typeof createTicketTypeInputSchema>;

export const createTicketType = createServerFn({ method: 'POST' })
  .validator((data: CreateTicketTypeInput) => createTicketTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const payload = {
      ...data,
      code: data.code.trim(),
      name: data.name.trim(),
      lumaTicketTypeId: data.lumaTicketTypeId.trim(),
    };

    if (!payload.code || !payload.name || !payload.lumaTicketTypeId) {
      throw new Error('Code, name, and Luma ticket type ID cannot be blank');
    }

    const existingCode = await db.query.ticketTypes.findFirst({
      where: eq(TicketTypesTable.code, payload.code),
    });
    if (existingCode) {
      throw new Error('A ticket type with this code already exists');
    }

    const existingName = await db.query.ticketTypes.findFirst({
      where: eq(TicketTypesTable.name, payload.name),
    });
    if (existingName) {
      throw new Error('A ticket type with this name already exists');
    }

    const existingLuma = await db.query.ticketTypes.findFirst({
      where: eq(TicketTypesTable.lumaTicketTypeId, payload.lumaTicketTypeId),
    });
    if (existingLuma) {
      throw new Error('A ticket type with this Luma ticket type ID already exists');
    }

    try {
      const [created] = await db.insert(TicketTypesTable).values(payload).returning();
      return { ticketType: created };
    } catch (e) {
      rethrowTicketTypeUniqueViolation(e);
    }
  });

const updateTicketTypeInputSchema = z
  .object({
    id: z.string().min(1),
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    lumaTicketTypeId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).some((k) => k !== 'id'), {
    message: 'At least one field besides id is required',
  });

export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeInputSchema>;

export const updateTicketType = createServerFn({ method: 'POST' })
  .validator((data: UpdateTicketTypeInput) => updateTicketTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const { id, ...rawPatch } = data;

    const current = await db.query.ticketTypes.findFirst({
      where: eq(TicketTypesTable.id, id),
    });
    if (!current) {
      throw new Error('Ticket type not found');
    }

    const patch: typeof rawPatch = { ...rawPatch };
    if (patch.code !== undefined) {
      patch.code = patch.code.trim();
      if (!patch.code) {
        throw new Error('Code cannot be blank');
      }
    }
    if (patch.name !== undefined) {
      patch.name = patch.name.trim();
      if (!patch.name) {
        throw new Error('Name cannot be blank');
      }
    }
    if (patch.lumaTicketTypeId !== undefined) {
      patch.lumaTicketTypeId = patch.lumaTicketTypeId.trim();
      if (!patch.lumaTicketTypeId) {
        throw new Error('Luma ticket type ID cannot be blank');
      }
    }

    if (patch.code !== undefined) {
      const taken = await db.query.ticketTypes.findFirst({
        where: eq(TicketTypesTable.code, patch.code),
      });
      if (taken && taken.id !== id) {
        throw new Error('A ticket type with this code already exists');
      }
    }

    if (patch.lumaTicketTypeId !== undefined) {
      const taken = await db.query.ticketTypes.findFirst({
        where: eq(TicketTypesTable.lumaTicketTypeId, patch.lumaTicketTypeId),
      });
      if (taken && taken.id !== id) {
        throw new Error('A ticket type with this Luma ticket type ID already exists');
      }
    }

    if (patch.name !== undefined) {
      const taken = await db.query.ticketTypes.findFirst({
        where: eq(TicketTypesTable.name, patch.name),
      });
      if (taken && taken.id !== id) {
        throw new Error('A ticket type with this name already exists');
      }
    }

    if (Object.keys(patch).length === 0) {
      return { ticketType: current };
    }

    try {
      const [updated] = await db
        .update(TicketTypesTable)
        .set(patch)
        .where(eq(TicketTypesTable.id, id))
        .returning();

      return { ticketType: updated };
    } catch (e) {
      rethrowTicketTypeUniqueViolation(e);
    }
  });

const deleteTicketTypeInputSchema = z.object({
  id: z.string().min(1),
});

export type DeleteTicketTypeInput = z.infer<typeof deleteTicketTypeInputSchema>;

export const deleteTicketType = createServerFn({ method: 'POST' })
  .validator((data: DeleteTicketTypeInput) => deleteTicketTypeInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAdmin();

    const linkCountResult = await db
      .select({ count: count() })
      .from(CheckinTypeTicketTypesTable)
      .where(eq(CheckinTypeTicketTypesTable.ticketTypeId, data.id));

    const linkCount = linkCountResult[0]?.count ?? 0;
    if (linkCount > 0) {
      throw new Error(
        `Cannot delete ticket type: ${linkCount} check-in eligibility link(s) still reference it. Remove it from check-in types first.`
      );
    }

    const userCountResult = await db
      .select({ count: count() })
      .from(UsersTable)
      .where(eq(UsersTable.ticketTypeId, data.id));

    const userCount = userCountResult[0]?.count ?? 0;
    if (userCount > 0) {
      throw new Error(`Cannot delete ticket type: ${userCount} participant(s) still reference it`);
    }

    const [deleted] = await db.delete(TicketTypesTable).where(eq(TicketTypesTable.id, data.id)).returning();
    if (!deleted) {
      throw new Error('Ticket type not found');
    }

    return { ticketType: deleted };
  });
