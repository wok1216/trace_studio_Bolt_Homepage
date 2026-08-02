import { useState, useEffect, useRef } from 'react';
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
import CopilotChat from '../components/CopilotChat';
import DesignMemoChat from '../components/DesignMemoChat';
import { findLegalBasis } from '../lib/siteAnalysis';
import { resolveProjectAnalysisData } from '../lib/projectAnalysisData';
import RiskScore from '../components/RiskScore';
import { loadDesignNote, saveDesignNote } from '../storage';

const SAVE_DESIGN_NOTE_URL = 'http://localhost:5678/webhook/save_design_note';
const DESIGN_NOTE_PLACEHOLDER =
  '설계 의도, 고민, 변경 사항 등을 자유롭게 작성하세요.';

type ProjectDetailTab = 'design-memo' | 'site-analysis';

const PROJECT_DETAIL_TABS: { id: ProjectDetailTab; label: string }[] = [
  { id: 'design-memo', label: '설계 메모' },
  { id: 'site-analysis', label: '대지분석' },
];

interface ProjectDetailPageProps {
  id: string;
  name: string;
  address: string;
  date: string;
  data: SiteAnalysisData;
  initialDesignNote?: string;
  onNavigate: (page: PageKey) => void;
  onDelete: (projectId: string) => Promise<boolean>;
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

async function persistDesignNote(projectId: string, note: string): Promise<void> {
  saveDesignNote(projectId, note);
  try {
    await fetch(SAVE_DESIGN_NOTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, designNote: note }),
    });
  } catch {
    // localStorage에 저장됨
  }
}

export default function ProjectDetailPage({
  id,
  name,
  address,
  date,
  data,
  initialDesignNote,
  onNavigate,
  onDelete,
}: ProjectDetailPageProps) {
  const analysisData = resolveProjectAnalysisData(data, address);
  const rows = buildTableRows(analysisData);
  console.log("ProjectDetail data (raw) =", data);
  console.log("ProjectDetail data (normalized) =", analysisData);
  const legalBasis = findLegalBasis(analysisData);

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

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [designNote, setDesignNote] = useState(
    () => initialDesignNote?.trim() || loadDesignNote(id),
  );
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('design-memo');
  const skipAutoSaveRef = useRef(true);

  const projectInfo = {
    id,
    name,
    address,
    date,
    analysisData: analysisData,
  };

  useEffect(() => {
    skipAutoSaveRef.current = true;
    setDesignNote(initialDesignNote?.trim() || loadDesignNote(id));
  }, [id, initialDesignNote]);

  useEffect(() => {
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void persistDesignNote(id, designNote);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [designNote, id]);

async function handleDelete() {
  setDeleting(true);
  setDeleteError("");

  try {
    const success = await onDelete(id);

    if (success) {
      setShowConfirm(false);
      onNavigate("projects");
    } else {
      alert("프로젝트 삭제에 실패했습니다.");
    }
  } catch (err) {
    console.error(err);
    alert("프로젝트 삭제에 실패했습니다.");
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-100 mb-8 max-w-xs">
        {PROJECT_DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white shadow-soft text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'design-memo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          <Card className="p-6 lg:p-8 shadow-soft-lg flex flex-col min-h-[520px]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">설계 메모장</h2>
            <textarea
              value={designNote}
              onChange={(e) => setDesignNote(e.target.value)}
              placeholder={DESIGN_NOTE_PLACEHOLDER}
              className="flex-1 w-full min-h-[420px] resize-none rounded-2xl border border-gray-200 px-4 py-3.5 text-[14px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all leading-relaxed"
            />
          </Card>

          <DesignMemoChat
            projectId={id}
            analysis={analysisData}
            designNote={designNote}
            className="h-full"
          />
        </div>
      )}

      {activeTab === 'site-analysis' && (
        <>
          {/* Map + Table side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
            {address && (
              <Card className="p-6 lg:p-8 shadow-soft-lg flex flex-col h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">위치 지도</h2>
                <div className="flex-1 min-h-0 flex flex-col">
                  <VWorldMap lat={lat} lng={lng} pnu={pnu} className="flex-1" />
                </div>
              </Card>
            )}

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

          <div className="mb-8">
            <CopilotChat analysis={analysisData} project={projectInfo} />
          </div>
        </>
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
