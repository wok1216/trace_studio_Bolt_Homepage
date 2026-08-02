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
import VWorldMap from '../components/VWorldMap';
import { findLegalBasis } from '../lib/siteAnalysis';
import { resolveProjectAnalysisData } from '../lib/projectAnalysisData';
import RiskScore from '../components/RiskScore';

interface SiteResultPageProps {
  address: string;
  data: SiteAnalysisData;
  onNavigate: (page: PageKey) => void;
  onSave: (project: { id: string; name: string }) => void;
}

interface TableRowData {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<string, string> = {
  "주소": "주소",
  "대지면적": "대지면적",
  "용도지역": "용도지역",
  "지목": "지목",
  "PNU": "PNU",
  "건폐율": "건폐율",
  "용적률": "용적률",
  "높이제한": "높이제한",
  "도로조건": "도로조건",
  "건축선": "건축선",
  "대지안의공지": "대지안의공지",
  "행위가능건축물": "행위가능건축물",
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

const ARRAY_FIELDS = new Set(['행위가능건축물', '적용법령']);

function findValue(data: SiteAnalysisData, key: string): string {

  const value = data[key as keyof SiteAnalysisData];

  if (value === undefined) return "확인 필요";
  if (value === null) return "";

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {

    return Object.values(value)
      .filter(Boolean)
      .join(", ");

  }

  return String(value);

}

function buildTableRows(data: SiteAnalysisData): TableRowData[] {
  return FIELD_KEYS.map(key => ({
    label: FIELD_LABELS[key],
    value: findValue(data, key),
  }));
}

export default function SiteResultPage({
  address,
  data,
  onNavigate,
  onSave,
}: SiteResultPageProps) {
  const [saved, setSaved] = useState(false);
  const analysisData = resolveProjectAnalysisData(data, address);
  const rows = buildTableRows(analysisData);
  const legalBasis = findLegalBasis(analysisData);

async function handleSave() {
  try {
    const projectName = prompt("프로젝트 이름을 입력하세요");

    if (!projectName) return;

    console.log("3. fetch 직전");

    if (!projectName) return;

    const response = await fetch("http://localhost:5678/webhook/save_project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
body: JSON.stringify({
    project_name: projectName,
    address: address,
    analysisData: analysisData
}),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error("저장 실패");
    }

onSave({
    id: result.projectId,
    name: projectName
});

    setSaved(true);

    setTimeout(() => setSaved(false), 2500);

  } catch (err) {
    console.error(err);
    alert("저장 실패");
  }
}
  
  console.log("SiteResult data (raw) =", data);
  console.log("SiteResult data (normalized) =", analysisData);
  console.log(Object.keys(analysisData));
  console.log("lat =", analysisData.lat);
  console.log("lng =", analysisData.lng);
  
const lat =
  typeof analysisData.lat === "number"
    ? analysisData.lat
    : Number(analysisData.lat) || 37.5665;

const lng =
  typeof analysisData.lng === "number"
    ? analysisData.lng
    : Number(analysisData.lng) || 126.9780;

const pnuValue = analysisData.PNU ?? analysisData.pnu;
const pnu =
  pnuValue !== undefined && pnuValue !== null && String(pnuValue).trim()
    ? String(pnuValue).trim()
    : undefined;

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

      {/* Map + Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
        {/* Map (left on desktop) */}
        {address && (
          <Card className="p-6 lg:p-8 shadow-soft-lg flex flex-col h-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">위치 지도</h2>
            <div className="flex-1 min-h-0 flex flex-col">
              <VWorldMap lat={lat} lng={lng} pnu={pnu} className="flex-1" />
            </div>
          </Card>
        )}

        {/* Analysis Table (right on desktop) */}
        <Card className="p-6 lg:p-8 shadow-soft-lg h-full">
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
      </div>

      <div className="mb-8">
        <RiskScore data={analysisData} />
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
          icon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {saved ? '저장됨' : '프로젝트 저장'}
        </Button>
      </div>
    </div>
  );
}
