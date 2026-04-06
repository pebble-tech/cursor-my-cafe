import { UsersTable } from '~/auth/schema';
import { verifyQRCodeValue } from '~/business.server/events/events';
import { env } from '~/config/env';
import { db, eq } from '~/drizzle.server';
import { lookupLumaGuestByCheckInKey } from '~/providers/luma/get-guest';
import { parseLumaCheckInUrl } from '~/providers/luma/parse-check-in-url';
import { logInfo } from '~/utils/logging';

type DbClient = typeof db;

export const OPS_CHECKIN_ERROR = {
  invalidQr: 'This QR code is not valid for check-in.',
  lumaNotConfigured:
    'Luma ticket scanning is not configured. Use the app QR code, or ask an admin to set LUMA_API_KEY and LUMA_EVENT_ID.',
  lumaWrongEvent: 'This ticket is not for this event.',
  lumaGuestUnknown: 'This ticket could not be verified. Ask the guest to show their QR again, or try the app QR code.',
  lumaAuth: 'Luma could not authorize this request. Ask an admin to verify the Luma API key.',
  lumaUnavailable: 'Luma is temporarily unavailable. Try again in a moment, or use the app QR code.',
  lumaNotImported:
    'This guest is on Luma but is not in our participant list. Re-import the latest Luma export (with api_id) before scanning Luma QRs.',
  participantNotFound: 'Participant not found',
} as const;

export type ResolvedOpsParticipant = NonNullable<Awaited<ReturnType<typeof db.query.users.findFirst>>>;

export type ResolveOpsScanResult =
  | { ok: true; participant: ResolvedOpsParticipant; via: 'internal_qr' | 'luma_qr' }
  | { ok: false; error: string };

export async function resolveOpsCheckinScan(db: DbClient, rawScan: string): Promise<ResolveOpsScanResult> {
  const internal = verifyQRCodeValue(rawScan);
  if (internal.valid) {
    const participant = await db.query.users.findFirst({
      where: eq(UsersTable.id, internal.participantId),
    });
    if (!participant) {
      return { ok: false, error: OPS_CHECKIN_ERROR.participantNotFound };
    }
    return { ok: true, participant, via: 'internal_qr' };
  }

  const lumaUrl = parseLumaCheckInUrl(rawScan);
  if (!lumaUrl) {
    return { ok: false, error: OPS_CHECKIN_ERROR.invalidQr };
  }

  const apiKey = env.LUMA_API_KEY;
  const eventId = env.LUMA_EVENT_ID;
  if (!apiKey?.trim() || !eventId?.trim()) {
    return { ok: false, error: OPS_CHECKIN_ERROR.lumaNotConfigured };
  }

  const configuredEventId = eventId.trim();
  if (lumaUrl.pathEventKey.startsWith('evt-') && lumaUrl.pathEventKey !== configuredEventId) {
    return { ok: false, error: OPS_CHECKIN_ERROR.lumaWrongEvent };
  }

  const lumaResult = await lookupLumaGuestByCheckInKey({
    apiKey: apiKey.trim(),
    eventId: configuredEventId,
    checkInKey: lumaUrl.pk,
  });

  if (!lumaResult.ok) {
    if (lumaResult.code === 'auth_failed') {
      return { ok: false, error: OPS_CHECKIN_ERROR.lumaAuth };
    }
    if (lumaResult.code === 'unavailable') {
      return { ok: false, error: OPS_CHECKIN_ERROR.lumaUnavailable };
    }
    return { ok: false, error: OPS_CHECKIN_ERROR.lumaGuestUnknown };
  }

  const participant = await db.query.users.findFirst({
    where: eq(UsersTable.lumaId, lumaResult.guestId),
  });

  if (!participant) {
    logInfo('Luma guest resolved but no local participant', { guestId: lumaResult.guestId });
    return { ok: false, error: OPS_CHECKIN_ERROR.lumaNotImported };
  }

  logInfo('Luma QR resolved to participant', {
    participantId: participant.id,
    guestId: lumaResult.guestId,
    via: 'luma_qr',
  });

  return { ok: true, participant, via: 'luma_qr' };
}
