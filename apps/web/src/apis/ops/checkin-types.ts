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

  const eligibility = await loadCheckinTypeTicketEligibility(
    db,
    checkinTypes.map((t) => t.id)
  );

  const list: OpsCheckinTypeItem[] = checkinTypes.map((t) => ({
    ...t,
    ticketEligibilitySummary: summaryForLoadedEligibility(eligibility.get(t.id)),
  }));

  return { checkinTypes: list };
});
