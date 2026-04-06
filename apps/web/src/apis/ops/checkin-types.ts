import { createServerFn } from '@tanstack/react-start';

import {
  loadCheckinTypeTicketEligibility,
  summaryForLoadedEligibility,
} from '@base/core/business.server/events/checkin-type-ticket-eligibility';
import { CheckinTypesTable } from '@base/core/business.server/events/schemas/schema';
import { asc, db, eq } from '@base/core/drizzle.server';

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
  const eligibility = await loadCheckinTypeTicketEligibility(db, ids);
  const summaryByCheckinType = new Map(
    ids.map((id) => [id, summaryForLoadedEligibility(eligibility.get(id))] as const)
  );

  const list: OpsCheckinTypeItem[] = checkinTypes.map((t) => ({
    ...t,
    ticketEligibilitySummary: summaryByCheckinType.get(t.id) ?? 'All tickets',
  }));

  return { checkinTypes: list };
});
