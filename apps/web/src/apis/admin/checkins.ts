import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

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

async function loadTicketEligibilityByCheckinType(
  checkinTypeIds: string[]
): Promise<Map<string, { ids: string[]; names: string[]; linkCount: number }>> {
  const map = new Map<string, { ids: string[]; names: string[]; linkCount: number }>();
  if (checkinTypeIds.length === 0) return map;

  const rows = await db
    .select({
      checkinTypeId: CheckinTypeTicketTypesTable.checkinTypeId,
      ticketTypeId: TicketTypesTable.id,
      ticketTypeName: TicketTypesTable.name,
      isActive: TicketTypesTable.isActive,
    })
    .from(CheckinTypeTicketTypesTable)
    .innerJoin(TicketTypesTable, eq(CheckinTypeTicketTypesTable.ticketTypeId, TicketTypesTable.id))
    .where(inArray(CheckinTypeTicketTypesTable.checkinTypeId, checkinTypeIds));

  for (const row of rows) {
    const cur = map.get(row.checkinTypeId) ?? { ids: [], names: [], linkCount: 0 };
    cur.linkCount += 1;
    if (row.isActive) {
      cur.ids.push(row.ticketTypeId);
      cur.names.push(row.ticketTypeName);
    }
    map.set(row.checkinTypeId, cur);
  }

  return map;
}

function ticketEligibilitySummary(linkCount: number, activeNames: string[]): string {
  if (linkCount === 0) return 'All tickets';
  if (activeNames.length === 0) return 'Restricted (no active ticket types)';
  return activeNames.join(', ');
}

export const listCheckinTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAdmin();

  const checkinTypes = await db.select().from(CheckinTypesTable).orderBy(asc(CheckinTypesTable.displayOrder));

  const eligibility = await loadTicketEligibilityByCheckinType(checkinTypes.map((t) => t.id));

  const list: CheckinTypeListItem[] = checkinTypes.map((t) => {
    const { ids, names, linkCount } = eligibility.get(t.id) ?? {
      ids: [],
      names: [],
      linkCount: 0,
    };
    return {
      ...t,
      allowedTicketTypeIds: ids,
      allowedTicketTypeNames: names,
      ticketEligibilitySummary: ticketEligibilitySummary(linkCount, names),
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

    const eligibility = await loadTicketEligibilityByCheckinType([newCheckinType.id]);
    const links = eligibility.get(newCheckinType.id) ?? { ids: [], names: [], linkCount: 0 };

    return {
      checkinType: {
        ...newCheckinType,
        allowedTicketTypeIds: links.ids,
        allowedTicketTypeNames: links.names,
        ticketEligibilitySummary: ticketEligibilitySummary(links.linkCount, links.names),
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

    const eligibility = await loadTicketEligibilityByCheckinType([id]);
    const links = eligibility.get(id) ?? { ids: [], names: [], linkCount: 0 };

    return {
      checkinType: {
        ...updatedCheckinType,
        allowedTicketTypeIds: links.ids,
        allowedTicketTypeNames: links.names,
        ticketEligibilitySummary: ticketEligibilitySummary(links.linkCount, links.names),
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
