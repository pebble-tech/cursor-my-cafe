const LUMA_HOSTS = new Set(['luma.com', 'www.luma.com', 'lu.ma', 'www.lu.ma']);

export type ParsedLumaCheckInUrl = {
  pathEventKey: string;
  pk: string;
};

export function parseLumaCheckInUrl(raw: string): ParsedLumaCheckInUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (!LUMA_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 2 || segments[0]?.toLowerCase() !== 'check-in') {
    return null;
  }

  const pathEventKey = segments[1] ?? '';
  if (!pathEventKey) {
    return null;
  }

  const pk = url.searchParams.get('pk')?.trim();
  if (!pk) {
    return null;
  }

  return { pathEventKey, pk };
}
