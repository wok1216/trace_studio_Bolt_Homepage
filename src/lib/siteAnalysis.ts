import type { SiteAnalysisData } from '../types';

const LEGAL_BASIS_KEYS = [
  '적용법령',
  'applied_law',
  'appliedLaw',
  'legal_basis',
  'legalBasis',
] as const;

function formatLegalBasisValue(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;

  if (Array.isArray(value)) {
    const items = value.map(String).filter(Boolean);
    return items.length > 0 ? items.join(', ') : null;
  }

  if (typeof value === 'object') {
    const text = Object.values(value as Record<string, unknown>)
      .filter(Boolean)
      .map(String)
      .join(', ');
    return text || null;
  }

  const text = String(value).trim();
  return text || null;
}

export function findLegalBasis(data: SiteAnalysisData): string | null {
  for (const key of LEGAL_BASIS_KEYS) {
    const value = data[key as keyof SiteAnalysisData];
    const formatted = formatLegalBasisValue(value);
    if (formatted) return formatted;
  }

  const nested = data.analysisData;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return findLegalBasis(nested as SiteAnalysisData);
  }

  return null;
}
