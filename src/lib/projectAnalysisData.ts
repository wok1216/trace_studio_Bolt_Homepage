import type { SiteAnalysisData } from '../types';

export const SITE_ANALYSIS_WEBHOOK_KEYS = [
  '주소',
  '대지면적',
  '용도지역',
  '지목',
  'PNU',
  'pnu',
  '건폐율',
  '용적률',
  '높이제한',
  '도로조건',
  '건축선',
  '대지안의공지',
  '행위가능건축물',
  '적용법령',
  'lat',
  'lng',
] as const;

/** n8n trace_studio 응답 내부 중첩 객체 (law_service 등) */
const NESTED_SERVICE_KEYS = [
  'law_service',
  'vworld_service',
  'land_service',
  'parcel_service',
  'vworld',
  'law',
] as const;

const FIELD_ALIASES: Record<string, string> = {
  address: '주소',
  pnu: 'PNU',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unwrapN8nPayload(raw: unknown): Record<string, unknown> | null {
  let item: unknown = raw;

  if (Array.isArray(item)) {
    item = item[0];
  }

  if (!isRecord(item)) return null;

  if (isRecord(item.json)) {
    return item.json;
  }

  if (item.body !== undefined) {
    return unwrapN8nPayload(item.body);
  }

  if (item.data !== undefined && (Array.isArray(item.data) || isRecord(item.data))) {
    const unwrapped = unwrapN8nPayload(item.data);
    if (unwrapped) return unwrapped;
  }

  return item;
}

function mergeField(
  target: SiteAnalysisData,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) return;

  const existing = target[key as keyof SiteAnalysisData];
  if (existing !== undefined && existing !== null && existing !== '') return;

  target[key] = value;
}

function flattenNestedServices(
  source: Record<string, unknown>,
  target: SiteAnalysisData,
): void {
  for (const bucket of NESTED_SERVICE_KEYS) {
    const nested = source[bucket];
    if (!isRecord(nested)) continue;

    for (const [key, value] of Object.entries(nested)) {
      mergeField(target, key, value);
    }
  }
}

/**
 * n8n trace_studio Webhook 응답 → 테이블/UI용 flat SiteAnalysisData
 *
 * n8n 예시:
 * { law_service: { 건폐율, 용적률, ... }, lat, lng, ... }
 * 또는 [{ ... }] / { json: { ... } }
 */
export function normalizeSiteAnalysisResponse(
  raw: unknown,
  fallbackAddress?: string,
): SiteAnalysisData {
  const obj = unwrapN8nPayload(raw);
  if (!obj) {
    return fallbackAddress ? { 주소: fallbackAddress } : {};
  }

  const result: SiteAnalysisData = {};

  for (const [key, value] of Object.entries(obj)) {
    if (NESTED_SERVICE_KEYS.includes(key as (typeof NESTED_SERVICE_KEYS)[number])) {
      continue;
    }
    if (key === 'analysisData') continue;
    mergeField(result, key, value);
  }

  flattenNestedServices(obj, result);

  let nestedAnalysis = obj.analysisData;
  if (typeof nestedAnalysis === 'string') {
    try {
      nestedAnalysis = JSON.parse(nestedAnalysis) as SiteAnalysisData;
    } catch {
      nestedAnalysis = undefined;
    }
  }

  if (isRecord(nestedAnalysis)) {
    flattenNestedServices(nestedAnalysis, result);
    for (const [key, value] of Object.entries(nestedAnalysis)) {
      if (key === 'analysisData') continue;
      if (NESTED_SERVICE_KEYS.includes(key as (typeof NESTED_SERVICE_KEYS)[number])) {
        continue;
      }
      mergeField(result, key, value);
    }
  }

  for (const [from, to] of Object.entries(FIELD_ALIASES)) {
    if (result[to] === undefined && obj[from] !== undefined) {
      result[to] = obj[from];
    }
  }

  if (fallbackAddress && result['주소'] === undefined) {
    result['주소'] = fallbackAddress;
  }

  return result;
}

/** API/저장소 raw → 대지분석 탭과 동일한 flat 분석 객체 */
export function resolveProjectAnalysisData(
  raw: SiteAnalysisData | undefined | null,
  fallbackAddress?: string,
): SiteAnalysisData {
  return normalizeSiteAnalysisResponse(raw, fallbackAddress);
}

/** n8n Webhook용 analysis — 대지분석 결과 필드만 포함 */
export function buildWebhookAnalysisPayload(
  raw: SiteAnalysisData | undefined | null,
  fallbackAddress?: string,
): SiteAnalysisData {
  const source = resolveProjectAnalysisData(raw, fallbackAddress);
  const payload: SiteAnalysisData = {};

  for (const key of SITE_ANALYSIS_WEBHOOK_KEYS) {
    const value = source[key as keyof SiteAnalysisData];
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  }

  return payload;
}
