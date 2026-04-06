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
      })
      .from(CheckinTypeTicketTypesTable)
      .innerJoin(TicketTypesTable, eq(CheckinTypeTicketTypesTable.ticketTypeId, TicketTypesTable.id))
      .where(inArray(CheckinTypeTicketTypesTable.checkinTypeId, ids));

    const namesByCt = new Map<string, string[]>();
    for (const row of rows) {
      const arr = namesByCt.get(row.checkinTypeId) ?? [];
      arr.push(row.ticketName);
      namesByCt.set(row.checkinTypeId, arr);
    }
    for (const id of ids) {
      const names = namesByCt.get(id);
      summaryByCheckinType.set(id, names?.length ? names.join(', ') : 'All tickets');
    }
  }

  const list: OpsCheckinTypeItem[] = checkinTypes.map((t) => ({
    ...t,
    ticketEligibilitySummary: summaryByCheckinType.get(t.id) ?? 'All tickets',
  }));

  return { checkinTypes: list };
});
