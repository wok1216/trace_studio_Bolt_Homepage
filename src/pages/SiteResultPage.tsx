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
  address: "주소",
  land_area: "대지면적",
  base_use_zone: "용도지역",
  land_category: "지목",
  pnu: "PNU",
  allowed_use: "허용용도",
  building_coverage_ratio: "건폐율",
  floor_area_ratio: "용적률",
  max_height: "최고높이",
  road_condition: "도로조건",
  parking_standard: "주차기준",
  public_open_space: "공개공지",
  landscaping: "조경",
  setback: "건축선 후퇴",
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

const ARRAY_FIELDS = new Set(['allowed_use', 'applied_law']);

function findValue(data: SiteAnalysisData, key: string): string {
  const value = data[key as keyof SiteAnalysisData];

  if (value === undefined) return "확인 필요";
  if (value === null) return "";

  if (ARRAY_FIELDS.has(key) && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "확인 필요";
  }

  return String(value);
}

function buildTableRows(data: SiteAnalysisData): TableRowData[] {
  return FIELD_KEYS.map(key => ({
    label: FIELD_LABELS[key],
    value: findValue(data, key),
  }));
}

function findLegalBasis(data: SiteAnalysisData): string | null {
  const val = data['applied_law' as keyof SiteAnalysisData];
  if (val === undefined) return null;
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(", ") : null;
  }
  if (val === null || val === "") return null;
  return String(val);
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
            <div className="w-full h-[450px] rounded-2xl bg-gray-100 flex items-center justify-center">
              지도 영역
            </div>
          </Card>
    )}
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
              <TableRow className="border-gray-50">
                <TableCell className="font-medium text-gray-600">
                  적용 법령
                </TableCell>
                <TableCell className="text-gray-800">{legalBasis}</TableCell>
              </TableRow>
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
