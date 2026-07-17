import { useState } from 'react';
import {
  MapPin,
  FileText,
  Save,
  Check,
  ArrowLeft,
  FileSpreadsheet,
  Scale,
} from 'lucide-react';
import type { PageKey, SiteAnalysisData } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table';

interface SiteResultPageProps {
  address: string;
  data: SiteAnalysisData;
  onNavigate: (page: PageKey) => void;
  onSave: () => void;
}

interface TableRowData {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<string, string> = {
  location: '위치',
  land_area: '대지면적',
  land_category: '지목',
  pnu: 'PNU',
  useZone: '용도지역',
  useDistrict: '용도지구',
  useArea: '용도구역',
  districtPlan: '지구단위계획',
  allowedUse: '허용용도',
  buildingCoverage: '건폐율',
  floorAreaRatio: '용적률',
  maxHeight: '최고높이',
  roadCondition: '도로조건',
  parkingStandard: '주차기준',
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

const LEGAL_BASIS_KEYS = [
  'legalBasis',
  'legal_basis',
  'legalBases',
  'legal_bases',
  'laws',
  'regulations',
  '근거법령',
];

function findValue(data: SiteAnalysisData, key: string): string {
  const candidates = [key, key.replace(/([A-Z])/g, '_$1').toLowerCase()];
  for (const candidate of candidates) {
    if (candidate in data) {
      const val = data[candidate];
      if (val === null || val === undefined) return '확인 필요';
      if (typeof val === 'string') return val || '확인 필요';
      if (typeof val === 'number' || typeof val === 'boolean') return String(val);
      if (Array.isArray(val)) return val.length > 0 ? val.map(String).join(', ') : '확인 필요';
      if (typeof val === 'object') {
        return Object.entries(val as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${v ?? '-'}`)
          .join(', ');
      }
    }
  }
  return '확인 필요';
}

function buildTableRows(data: SiteAnalysisData): TableRowData[] {
  return FIELD_KEYS.map((key) => ({
    label: FIELD_LABELS[key],
    value: findValue(data, key),
  }));
}

function findLegalBasis(data: SiteAnalysisData): Record<string, string> | null {
  for (const key of LEGAL_BASIS_KEYS) {
    if (key in data) {
      const val = data[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return val as Record<string, string>;
      }
      if (Array.isArray(val) && val.length > 0) {
        const result: Record<string, string> = {};
        for (const item of val) {
          if (typeof item === 'object' && item !== null) {
            const entry = item as Record<string, unknown>;
            const field = String(entry.field ?? entry.item ?? entry.label ?? '');
            const law = String(entry.law ?? entry.regulation ?? entry.basis ?? '');
            if (field && law) result[field] = law;
          }
        }
        return Object.keys(result).length > 0 ? result : null;
      }
    }
  }
  return null;
}

export default function SiteResultPage({
  address,
  data,
  onNavigate,
  onSave,
}: SiteResultPageProps) {
  const [saved, setSaved] = useState(false);
  const rows = buildTableRows(data);
  const legalBasis = findLegalBasis(data);

  function handleSave() {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleDownloadPDF() {
    // PDF download click event
  }

  function handleDownloadExcel() {
    // Excel download click event
  }

  const mapSrc = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=16&size=600x400&key=`;

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

      {/* Table + Map side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Analysis Table */}
        <Card className="p-6 lg:p-8 shadow-soft-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-6">대지 분석 결과</h2>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="w-[40%]">항목</TableHead>
                <TableHead>결과</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="border-gray-50">
                  <TableCell className="font-medium text-gray-600">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-gray-800">{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Static Map */}
        {address && (
          <Card className="p-6 lg:p-8 shadow-soft-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6">위치 지도</h2>
            <img
              src={mapSrc}
              alt={`정적 지도 - ${address}`}
              className="w-full rounded-2xl"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
          </Card>
        )}
      </div>

      {/* Legal Basis */}
      {legalBasis && (
        <Card className="p-6 lg:p-8 mb-8 shadow-soft-lg">
          <div className="flex items-center gap-2 mb-6">
            <Scale className="w-5 h-5 text-brand-600" />
            <h2 className="text-xl font-bold text-gray-900">근거법령</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="w-[40%]">항목</TableHead>
                <TableHead>근거법령</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(legalBasis).map(([field, law]) => (
                <TableRow key={field} className="border-gray-50">
                  <TableCell className="font-medium text-gray-600">
                    {field}
                  </TableCell>
                  <TableCell className="text-gray-800">{law}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          icon={<FileText className="w-4 h-4" />}
          onClick={handleDownloadPDF}
        >
          PDF 다운로드
        </Button>
        <Button
          variant="secondary"
          icon={<FileSpreadsheet className="w-4 h-4" />}
          onClick={handleDownloadExcel}
        >
          Excel 다운로드
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
