import { ShieldCheck } from 'lucide-react';
import Card from './Card';
import type { SiteAnalysisData } from '../types';
import { parseProjectRiskFromAnalysis, type RiskLevel } from '../lib/riskScore';

interface RiskScoreProps {
  data: SiteAnalysisData;
  className?: string;
}

const LEVEL_STYLES: Record<
  RiskLevel,
  { badge: string; score: string; ring: string }
> = {
  low: {
    badge: 'bg-green-50 text-green-700 border-green-100',
    score: 'text-green-600',
    ring: 'border-green-100 bg-green-50/40',
  },
  medium: {
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    score: 'text-amber-600',
    ring: 'border-amber-100 bg-amber-50/40',
  },
  high: {
    badge: 'bg-red-50 text-red-700 border-red-100',
    score: 'text-red-600',
    ring: 'border-red-100 bg-red-50/40',
  },
};

export default function RiskScore({ data, className = '' }: RiskScoreProps) {
  const risk = parseProjectRiskFromAnalysis(data);

  return (
    <Card className={`p-6 lg:p-8 shadow-soft-lg ${className}`.trim()}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        <div className="flex-shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">프로젝트 리스크</h2>
          </div>

          {risk ? (
            <div
              className={`inline-flex flex-col items-center justify-center rounded-3xl border px-8 py-6 min-w-[160px] ${LEVEL_STYLES[risk.level].ring}`}
            >
              <span
                className={`text-5xl font-bold tracking-tight ${LEVEL_STYLES[risk.level].score}`}
              >
                {risk.score}
                <span className="text-2xl font-semibold">점</span>
              </span>
              <span
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-semibold ${LEVEL_STYLES[risk.level].badge}`}
              >
                <span>{risk.emoji}</span>
                {risk.levelLabel}
              </span>
            </div>
          ) : (
            <p className="text-[14px] text-gray-400 px-2">분석 결과 없음</p>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-3">리스크 요약</h3>
          {risk ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ul className="space-y-2">
                {risk.pass.map((label) => (
                  <li
                    key={`pass-${label}`}
                    className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700"
                  >
                    <span className="flex-shrink-0 leading-5">✓</span>
                    <span className="leading-5">{label}</span>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2">
                {risk.review.map((label) => (
                  <li
                    key={`review-${label}`}
                    className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700"
                  >
                    <span className="flex-shrink-0 leading-5">⚠</span>
                    <span className="leading-5">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[14px] text-gray-400">분석 결과 없음</p>
          )}
        </div>
      </div>
    </Card>
  );
}
