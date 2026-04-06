import { logWarning } from '~/utils/logging';

const LUMA_API_BASE = 'https://public-api.luma.com';

export type LumaGuestLookupOk = {
  ok: true;
  guestId: string;
  /** Minimal fields for logs; avoid storing or logging full PII. */
  diagnosticName: string | null;
};

export type LumaGuestLookupErrCode =
  | 'guest_not_found'
  | 'auth_failed'
  | 'unavailable'
  | 'bad_response';

export type LumaGuestLookupErr = {
  ok: false;
  code: LumaGuestLookupErrCode;
  status?: number;
};

export type LumaGuestLookupResult = LumaGuestLookupOk | LumaGuestLookupErr;

type LumaGetGuestJson = {
  guest?: {
    id?: string;
    user_name?: string | null;
  } | null;
  message?: string;
};

export async function lookupLumaGuestByCheckInKey(input: {
  apiKey: string;
  eventId: string;
  checkInKey: string;
  signal?: AbortSignal;
}): Promise<LumaGuestLookupResult> {
  const params = new URLSearchParams({
    event_id: input.eventId,
    id: input.checkInKey,
  });

  const url = `${LUMA_API_BASE}/v1/event/get-guest?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-luma-api-key': input.apiKey,
        Accept: 'application/json',
      },
      signal: input.signal,
    });
  } catch (err) {
    logWarning('Luma get-guest request failed', { cause: err instanceof Error ? err.message : 'unknown' });
    return { ok: false, code: 'unavailable' };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, code: 'auth_failed', status: response.status };
  }

  if (response.status === 404) {
    return { ok: false, code: 'guest_not_found', status: 404 };
  }

  if (!response.ok) {
    if (response.status >= 500 || response.status === 429) {
      return { ok: false, code: 'unavailable', status: response.status };
    }
    return { ok: false, code: 'guest_not_found', status: response.status };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, code: 'bad_response', status: response.status };
  }

  const parsed = body as LumaGetGuestJson;
  const guestId = typeof parsed.guest?.id === 'string' ? parsed.guest.id : undefined;

  if (!guestId) {
    return { ok: false, code: 'bad_response', status: response.status };
  }

  const name = parsed.guest?.user_name;
  const diagnosticName = typeof name === 'string' && name.trim() ? name.trim() : null;

  return { ok: true, guestId, diagnosticName };
}
