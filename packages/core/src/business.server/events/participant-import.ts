import { UserTypeEnum, type UserType } from '~/config/constant';

export type TicketTypeLookupRow = {
  id: string;
  name: string;
  lumaTicketTypeId: string;
};

export type ImportParticipantRow = {
  name: string;
  email: string;
  lumaId?: string;
  userType: UserType;
  ticketLumaTypeId?: string;
};

export type ExistingImportOwnedParticipant = {
  name: string;
  lumaId: string | null;
  ticketTypeId: string | null;
};

export type ImportParticipantUpdate = {
  id: string;
  name: string;
  lumaId: string | null;
  ticketTypeId: string | null;
};

export function buildTicketTypeLookupMaps(ticketTypes: TicketTypeLookupRow[]): {
  byLumaId: Map<string, string>;
} {
  const byLumaId = new Map<string, string>();

  for (const ticketType of ticketTypes) {
    byLumaId.set(ticketType.lumaTicketTypeId, ticketType.id);
  }

  return { byLumaId };
}

export function importEmailGroupMergeConflicts(
  resolutions: Array<{
    participant: Pick<ImportParticipantRow, 'name' | 'lumaId'>;
    ticketTypeId: string | null;
  }>
): { ok: true } | { ok: false; reason: string } {
  const dimensions: Array<{ values: string[]; reason: string }> = [
    {
      values: resolutions.map((resolution) => (resolution.ticketTypeId === null ? '__null__' : resolution.ticketTypeId)),
      reason: 'Conflicting ticket data for same email in import file',
    },
    {
      values: resolutions.map((resolution) => {
        const value = resolution.participant.lumaId?.trim();
        return value && value.length > 0 ? value : '__null__';
      }),
      reason: 'Conflicting luma_id for same email in import file',
    },
    {
      values: resolutions.map((resolution) => resolution.participant.name.trim()),
      reason: 'Conflicting name for same email in import file',
    },
  ];

  for (const { values, reason } of dimensions) {
    if (new Set(values).size > 1) {
      return { ok: false, reason };
    }
  }

  return { ok: true };
}

export function resolveTicketTypeIdForImport(
  participant: Pick<ImportParticipantRow, 'userType' | 'ticketLumaTypeId'>,
  byLumaId: Map<string, string>
): { ticketTypeId: string | null; error?: string } {
  const lumaTicketTypeId = participant.ticketLumaTypeId?.trim();
  const idFromLuma = lumaTicketTypeId ? byLumaId.get(lumaTicketTypeId) : undefined;

  if (participant.userType !== UserTypeEnum.regular) {
    if (idFromLuma !== undefined) {
      return { ticketTypeId: idFromLuma };
    }
    return { ticketTypeId: null };
  }

  if (!lumaTicketTypeId) {
    return { ticketTypeId: null, error: 'Ticket type id required for regular participants' };
  }
  if (idFromLuma === undefined) {
    return { ticketTypeId: null, error: `Unknown ticket_type_id: ${lumaTicketTypeId}` };
  }
  return { ticketTypeId: idFromLuma };
}

export function buildImportParticipantUpdate(
  existing: ExistingImportOwnedParticipant,
  next: ImportParticipantUpdate
): ImportParticipantUpdate | null {
  if (
    existing.name === next.name &&
    existing.lumaId === next.lumaId &&
    existing.ticketTypeId === next.ticketTypeId
  ) {
    return null;
  }

  return next;
}
