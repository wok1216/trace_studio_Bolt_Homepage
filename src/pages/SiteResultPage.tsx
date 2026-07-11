import { useState } from 'react';
import {
  MapPin,
  FileText,
  Image as ImageIcon,
  PenTool,
  Save,
  Check,
  ArrowLeft,
  Building2,
  Layers,
  Ruler,
  Trees,
  Navigation,
  FileBarChart,
} from 'lucide-react';
import type { PageKey, SiteAnalysisData } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';

interface SiteResultPageProps {
  address: string;
  data: SiteAnalysisData;
  onNavigate: (page: PageKey) => void;
  onSave: () => void;
}

// Render arbitrary JSON data in a clean, structured way
function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-gray-700">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-300">—</span>;
    return (
      <div className="space-y-1.5">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-brand-300 text-[12px] mt-0.5">•</span>
            <div>{renderValue(item, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className={depth > 0 ? 'pl-3 border-l border-gray-100' : 'space-y-3'}>
        {entries.map(([key, val]) => (
          <div key={key} className={depth === 0 ? '' : 'py-1'}>
            {depth === 0 ? (
              <div>
                <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {key}
                </p>
                <div className="text-[14px]">{renderValue(val, depth + 1)}</div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:gap-2">
                <span className="text-[13px] font-medium text-gray-500 sm:min-w-[140px]">
                  {key}:
                </span>
                <span className="text-[14px]">{renderValue(val, depth + 1)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-gray-300">—</span>;
}

// Extract top-level sections from the data
function getSections(data: SiteAnalysisData) {
  const entries = Object.entries(data);
  return entries.map(([key, value]) => ({
    key,
    value,
  }));
}

// Pick an icon for a section based on key name
function getSectionIcon(key: string) {
  const lower = key.toLowerCase();
  if (lower.includes('address') || lower.includes('주소') || lower.includes('location'))
    return MapPin;
  if (lower.includes('area') || lower.includes('면적') || lower.includes('size'))
    return Ruler;
  if (lower.includes('building') || lower.includes('건물') || lower.includes('구조'))
    return Building2;
  if (lower.includes('zone') || lower.includes('지구') || lower.includes('용도'))
    return Layers;
  if (lower.includes('green') || lower.includes('조경') || lower.includes('환경'))
    return Trees;
  if (lower.includes('road') || lower.includes('도로') || lower.includes('접'))
    return Navigation;
  if (lower.includes('law') || lower.includes('법') || lower.includes('규'))
    return FileBarChart;
  return FileText;
}

export default function SiteResultPage({
  address,
  data,
  onNavigate,
  onSave,
}: SiteResultPageProps) {
  const [saved, setSaved] = useState(false);
  const sections = getSections(data);

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDownloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-analysis-${address.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadPNG() {
    // Create a simple visual snapshot as SVG -> PNG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
        <rect width="800" height="600" fill="#ffffff"/>
        <text x="40" y="50" font-family="sans-serif" font-size="24" font-weight="bold" fill="#1d1d1f">대지 분석 결과</text>
        <text x="40" y="80" font-family="sans-serif" font-size="14" fill="#9ca3af">${address}</text>
        <text x="40" y="130" font-family="sans-serif" font-size="12" fill="#4b5563">${JSON.stringify(data, null, 2).slice(0, 2000)}</text>
      </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `site-analysis-${address.slice(0, 10)}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in px-5 lg:px-10 py-8 lg:py-12">
      {/* Back */}
      <button
        onClick={() => onNavigate('home')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        홈으로
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 mb-4">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-[12px] font-medium text-brand-600">대지 분석 완료</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3">
          대지 분석 결과
        </h1>
        <div className="flex items-center gap-2 text-[15px] text-gray-500">
          <MapPin className="w-4 h-4 text-gray-400" />
          {address}
        </div>
      </div>

      {/* Large Analysis Board */}
      <Card className="p-6 lg:p-10 mb-8 shadow-soft-lg">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Site Analysis Board</h2>
            <p className="text-[13px] text-gray-400">AI 분석 결과를 확인하세요</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
            <Check className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[12px] font-medium text-green-600">분석 완료</span>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">분석 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sections.map((section) => {
              const Icon = getSectionIcon(section.key);
              return (
                <div
                  key={section.key}
                  className="p-5 rounded-2xl bg-gray-50/60 border border-gray-100 animate-fade-in-up"
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Icon className="w-[18px] h-[18px] text-brand-600" strokeWidth={2} />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-800 capitalize">
                      {section.key}
                    </h3>
                  </div>
                  <div className="text-[14px] leading-relaxed">
                    {renderValue(section.value)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          icon={<FileText className="w-4 h-4" />}
          onClick={handleDownloadJSON}
        >
          PDF 다운로드
        </Button>
        <Button
          variant="secondary"
          icon={<ImageIcon className="w-4 h-4" />}
          onClick={handleDownloadPNG}
        >
          PNG 다운로드
        </Button>
        <Button
          variant="secondary"
          icon={<PenTool className="w-4 h-4" />}
          onClick={() => onNavigate('design')}
        >
          시안 생성하기
        </Button>
        <Button
          icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {saved ? '저장됨' : '프로젝트 저장'}
        </Button>
      </div>
    </div>
  );
}
