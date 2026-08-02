import type { SiteAnalysisData } from '../types';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProjectRiskApi {
  risk_score: number;
  risk_level: string;
  pass: string[];
  review: string[];
}

export interface ProjectRiskResult {
  score: number;
  level: RiskLevel;
  levelLabel: string;
  emoji: string;
  pass: string[];
  review: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function extractProjectRiskRaw(data: SiteAnalysisData): unknown {
  if (data.project_risk !== undefined) {
    return data.project_risk;
  }

  const nested = data.analysisData;
  if (isRecord(nested) && nested.project_risk !== undefined) {
    return nested.project_risk;
  }

  return undefined;
}

function normalizeRiskLevel(level: string): RiskLevel {
  const normalized = level.trim().toLowerCase();
  if (normalized === 'low') return 'low';
  if (normalized === 'high') return 'high';
  return 'medium';
}

function getLevelLabel(level: RiskLevel): string {
  if (level === 'low') return 'Low';
  if (level === 'high') return 'High';
  return 'Medium';
}

function getLevelEmoji(level: RiskLevel): string {
  if (level === 'low') return '🟢';
  if (level === 'high') return '🔴';
  return '🟡';
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

/** API 응답의 project_risk → UI 표시용 데이터 */
export function parseProjectRiskFromAnalysis(
  data: SiteAnalysisData,
): ProjectRiskResult | null {
  const raw = extractProjectRiskRaw(data);
  if (!isRecord(raw)) return null;

  const score = Number(raw.risk_score);
  if (!Number.isFinite(score)) return null;

  const pass = toStringList(raw.pass);
  const review = toStringList(raw.review);
  const level = normalizeRiskLevel(String(raw.risk_level ?? ''));

  return {
    score: Math.round(score),
    level,
    levelLabel: getLevelLabel(level),
    emoji: getLevelEmoji(level),
    pass,
    review,
  };
}
