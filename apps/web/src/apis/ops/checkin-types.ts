import { createServerFn } from '@tanstack/react-start';

import {
  CheckinTypeTicketTypesTable,
  CheckinTypesTable,
  TicketTypesTable,
} from '@base/core/business.server/events/schemas/schema';
import { asc, db, eq, inArray } from '@base/core/drizzle.server';

import { requireOpsOrAdmin } from '~/apis/auth';

export type OpsCheckinTypeItem = {
  id: string;
  name: string;
  type: (typeof CheckinTypesTable.$inferSelect)['type'];
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  ticketEligibilitySummary: string;
};

export const listCheckinTypes = createServerFn({ method: 'GET' }).handler(async () => {
  await requireOpsOrAdmin();

  const checkinTypes = await db
    .select()
    .from(CheckinTypesTable)
    .where(eq(CheckinTypesTable.isActive, true))
    .orderBy(asc(CheckinTypesTable.displayOrder));

  const ids = checkinTypes.map((t) => t.id);
  const summaryByCheckinType = new Map<string, string>();

  if (ids.length > 0) {
    const rows = await db
      .select({
        checkinTypeId: CheckinTypeTicketTypesTable.checkinTypeId,
        ticketName: TicketTypesTable.name,
        isActive: TicketTypesTable.isActive,
      })
      .from(CheckinTypeTicketTypesTable)
      .innerJoin(TicketTypesTable, eq(CheckinTypeTicketTypesTable.ticketTypeId, TicketTypesTable.id))
      .where(inArray(CheckinTypeTicketTypesTable.checkinTypeId, ids));

    const namesByCt = new Map<string, string[]>();
    const linkCountByCt = new Map<string, number>();
    for (const row of rows) {
      linkCountByCt.set(row.checkinTypeId, (linkCountByCt.get(row.checkinTypeId) ?? 0) + 1);
      if (row.isActive) {
        const arr = namesByCt.get(row.checkinTypeId) ?? [];
        arr.push(row.ticketName);
        namesByCt.set(row.checkinTypeId, arr);
      }
    }
    for (const id of ids) {
      const linkCount = linkCountByCt.get(id) ?? 0;
      const names = namesByCt.get(id);
      if (linkCount === 0) {
        summaryByCheckinType.set(id, 'All tickets');
      } else if (!names?.length) {
        summaryByCheckinType.set(id, 'Restricted (no active ticket types)');
      } else {
        summaryByCheckinType.set(id, names.join(', '));
      }
    }
  }

  const list: OpsCheckinTypeItem[] = checkinTypes.map((t) => ({
    ...t,
    ticketEligibilitySummary: summaryByCheckinType.get(t.id) ?? 'All tickets',
  }));

  return { checkinTypes: list };
});
