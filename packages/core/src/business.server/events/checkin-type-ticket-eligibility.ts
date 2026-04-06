import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { schema } from '~/drizzle.server';
import {
  CheckinTypeTicketTypesTable,
  TicketTypesTable,
} from '~/business.server/events/schemas/schema';

export type DbClient = NodePgDatabase<typeof schema>;

/** All persisted join rows plus active-only names used for enforcement and copy. */
export type CheckinTypeTicketEligibility = {
  linkedTicketTypeIds: string[];
  activeTicketTypeNames: string[];
  linkCount: number;
};

const emptyEligibility = (): CheckinTypeTicketEligibility => ({
  linkedTicketTypeIds: [],
  activeTicketTypeNames: [],
  linkCount: 0,
});

/** Human-readable rule for ops/admin (matches scan-time “active ticket types only”). */
export function formatTicketEligibilitySummary(linkCount: number, activeTicketTypeNames: string[]): string {
  if (linkCount === 0) return 'All tickets';
  if (activeTicketTypeNames.length === 0) return 'Restricted (no active ticket types)';
  return activeTicketTypeNames.join(', ');
}

export function summaryForLoadedEligibility(loaded: CheckinTypeTicketEligibility | undefined): string {
  const e = loaded ?? emptyEligibility();
  return formatTicketEligibilitySummary(e.linkCount, e.activeTicketTypeNames);
}

export async function loadCheckinTypeTicketEligibility(
  db: DbClient,
  checkinTypeIds: string[]
): Promise<Map<string, CheckinTypeTicketEligibility>> {
  const map = new Map<string, CheckinTypeTicketEligibility>();
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
    const cur = map.get(row.checkinTypeId) ?? emptyEligibility();
    cur.linkCount += 1;
    cur.linkedTicketTypeIds.push(row.ticketTypeId);
    if (row.isActive) {
      cur.activeTicketTypeNames.push(row.ticketTypeName);
    }
    map.set(row.checkinTypeId, cur);
  }

  return map;
}
