import { useState } from 'react';
import {
  MapPin,
  ArrowLeft,
  Scale,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
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

interface ProjectDetailPageProps {
  name: string;
  address: string;
  date: string;
  data: SiteAnalysisData;
  onNavigate: (page: PageKey) => void;
  onDelete: (projectName: string) => Promise<boolean>;
}

interface TableRowData {
  label: string;
  value: string;
}

const FIELD_LABELS: Record<string, string> = {
  "주소": "주소",
  "대지면적": "대지면적",
  "지역": "용도지역",
  "지목": "지목",
  "pnu": "pnu",
  "행위가능건축물": "행위가능건축물",
  "건폐율": "건폐율",
  "용적률": "용적률",
  "높이제한": "높이제한",
  "도로조건": "도로조건",
  "건축선": "건축선",
  "대지와도로의관계": "대지와도로의관계",
  "대지안의공지": "대지안의공지",
};

const FIELD_KEYS = Object.keys(FIELD_LABELS);

const ARRAY_FIELDS = new Set([    "행위가능건축물",
    "적용법령"]);

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

function findLegalBasis(data: SiteAnalysisData): string | null {
  const val = data['applied_law' as keyof SiteAnalysisData];
  if (val === undefined) return null;
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(", ") : null;
  }
  if (val === null || val === "") return null;
  return String(val);
}


console.log("적용법령 =", ["적용법령"]);

export default function ProjectDetailPage({
  name,
  address,
  date,
  data,
  onNavigate,
  onDelete,
}: ProjectDetailPageProps) {
  const rows = buildTableRows(data);
  console.log("SiteResultPage data =", data);
  const legalBasis = findLegalBasis(data);

  const lat =
    typeof data.lat === "number"
      ? data.lat
      : Number(data.lat) || 37.5665;

  const lng =
    typeof data.lng === "number"
      ? data.lng
      : Number(data.lng) || 126.9780;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const ok = await onDelete(name);
      if (!ok) {
        setDeleteError('프로젝트 삭제에 실패했습니다.');
        return;
      }
      setShowConfirm(false);
      onNavigate('projects');
    } catch {
      setDeleteError('프로젝트 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="animate-fade-in px-5 lg:px-10 py-8 lg:py-12">
      {/* Back */}
      <button
        onClick={() => onNavigate('projects')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        프로젝트 목록
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 mb-4">
          <MapPin className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-[12px] font-medium text-brand-600">{date}</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-3">
          {name}
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
            <VWorldMap lat={lat} lng={lng} />
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
          variant="primary"
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => setShowConfirm(true)}
          className="!bg-red-600 hover:!bg-red-700 active:!bg-red-800"
        >
          프로젝트 삭제
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setShowConfirm(false)}
          />
          <Card className="relative z-10 w-full max-w-md p-6 shadow-soft-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">프로젝트 삭제</h3>
              </div>
              <button
                onClick={() => !deleting && setShowConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              정말 <span className="font-semibold text-gray-900">{name}</span> 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            {deleteError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <p className="text-[12px] text-red-600 font-medium">{deleteError}</p>
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                취소
              </Button>
              <Button
                variant="primary"
                icon={deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                onClick={handleDelete}
                disabled={deleting}
                className="!bg-red-600 hover:!bg-red-700 active:!bg-red-800"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
