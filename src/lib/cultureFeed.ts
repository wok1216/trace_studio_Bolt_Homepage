export interface CultureItem {
  title: string;
  period: string;
  url: string;
}

const LINK_FIELD_NAMES = [
  'link',
  'url',
  'originallink',
  'originalLink',
  'href',
  'website',
] as const;

function resolveLinkValue(value: unknown, depth = 0): string {
  if (value == null || depth > 2) return '';

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '[object Object]') return '';
    return trimmed;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['url', 'href', 'link', 'value', 'contest_pk', 'pk', 'id']) {
      const nested = resolveLinkValue(obj[key], depth + 1);
      if (nested) return nested;
    }
    console.log('[cultureFeed] link field is object — could not resolve:', value);
  }

  return '';
}

export function extractCultureLink(row: Record<string, unknown>): string {
  for (const field of LINK_FIELD_NAMES) {
    const resolved = resolveLinkValue(row[field]);
    if (resolved) return resolved;
  }
  return '';
}

export function openCultureLink(url: string, context?: unknown): void {
  const link = url.trim();
  if (!link) {
    console.log('[cultureFeed] link is empty or undefined — raw item:', context);
    return;
  }
  if (!/^https?:\/\//i.test(link)) {
    console.log('[cultureFeed] link is not a valid URL — value:', link, 'raw item:', context);
    return;
  }
  window.open(link, '_blank', 'noopener,noreferrer');
}

export function normalizeCultureList(data: unknown, limit = 3): CultureItem[] {
  if (!data) return [];

  let rawList: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    rawList = data.flatMap((item) => {
      if (Array.isArray(item)) return item;
      if (item && typeof item === 'object' && 'json' in item) {
        return [(item as { json: Record<string, unknown> }).json];
      }
      return [item as Record<string, unknown>];
    });
  } else if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) rawList = obj.data as Record<string, unknown>[];
    else if (Array.isArray(obj.items)) rawList = obj.items as Record<string, unknown>[];
    else if (Array.isArray(obj.results)) rawList = obj.results as Record<string, unknown>[];
    else if (obj.title || obj.link) rawList = [obj];
  }

  return rawList
    .map((item) => {
      const row = (item?.json ?? item) as Record<string, unknown>;
      const startDate = String(row.startDate ?? '');
      const endDate = String(row.endDate ?? '');
      const period =
        (row.period as string) ||
        (startDate && endDate ? `${startDate} ~ ${endDate}` : startDate || endDate || '');

      const url = extractCultureLink(row);
      if (!url) {
        console.log('[cultureFeed] missing link — response row:', row);
        console.log('[cultureFeed] link field type:', typeof row.link, 'value:', row.link);
      }

      return {
        title: String(row.title ?? row.name ?? '제목 없음'),
        period,
        url,
      };
    })
    .filter((item) => item.title && item.title !== '제목 없음')
    .slice(0, limit);
}

export async function fetchCultureList(webhookUrl: string, limit = 3): Promise<CultureItem[]> {
  try {
    const response = await fetch(webhookUrl);
    if (!response.ok) return [];

    const text = await response.text();
    if (!text) return [];

    const data = JSON.parse(text) as unknown;
    return normalizeCultureList(data, limit);
  } catch (err) {
    console.error('[cultureFeed] fetch failed:', webhookUrl, err);
    return [];
  }
}
