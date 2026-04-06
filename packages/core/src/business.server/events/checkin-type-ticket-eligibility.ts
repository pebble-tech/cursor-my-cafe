import { eq, inArray } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { schema } from '~/drizzle.server';
import {
  CheckinTypeTicketTypesTable,
  TicketTypesTable,
} from '~/business.server/events/schemas/schema';

export type DbClient = NodePgDatabase<typeof schema>;

export type CheckinTypeTicketEligibility = {
  linkedTicketTypeIds: string[];
  activeTicketTypeNames: string[];
  linkCount: number;
};

export type LinkedTicketType = {
  ticketTypeId: string;
  isActive: boolean;
};

export type TicketEligibilityEvaluation =
  | {
      eligible: true;
    }
  | {
      eligible: false;
      message: string;
      participantTicketTypeName: string | null;
    };

const emptyEligibility = (): CheckinTypeTicketEligibility => ({
  linkedTicketTypeIds: [],
  activeTicketTypeNames: [],
  linkCount: 0,
});

export function formatTicketEligibilitySummary(linkCount: number, activeTicketTypeNames: string[]): string {
  if (linkCount === 0) return 'All tickets';
  if (activeTicketTypeNames.length === 0) return 'Restricted (no active ticket types)';
  return activeTicketTypeNames.join(', ');
}

export function summaryForLoadedEligibility(loaded: CheckinTypeTicketEligibility | undefined): string {
  const e = loaded ?? emptyEligibility();
  return formatTicketEligibilitySummary(e.linkCount, e.activeTicketTypeNames);
}

export function evaluateTicketEligibilityForCheckinType(args: {
  checkinTypeName: string;
  participantTicketTypeId: string | null;
  participantTicketTypeName: string | null;
  linkedTicketTypes: LinkedTicketType[];
}): TicketEligibilityEvaluation {
  const { checkinTypeName, participantTicketTypeId, participantTicketTypeName, linkedTicketTypes } = args;

  if (linkedTicketTypes.length === 0) {
    return { eligible: true };
  }

  const activeAllowedTicketTypeIds = new Set(
    linkedTicketTypes.filter((ticketType) => ticketType.isActive).map((ticketType) => ticketType.ticketTypeId)
  );

  if (!participantTicketTypeId) {
    return {
      eligible: false,
      message: `Participant has no eligible ticket assigned for ${checkinTypeName}`,
      participantTicketTypeName,
    };
  }

  if (!activeAllowedTicketTypeIds.has(participantTicketTypeId)) {
    return {
      eligible: false,
      message: `This ticket is not eligible for ${checkinTypeName}`,
      participantTicketTypeName,
    };
  }

  return { eligible: true };
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
