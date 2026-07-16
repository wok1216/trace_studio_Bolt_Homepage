import { useState, useRef, useCallback, useEffect } from 'react';
import {
  MapPin,
  ArrowRight,
  Lightbulb,
  Briefcase,
  Bot,
  Sun,
  Wind,
  Map,
  BarChart2,
  Leaf,
  HelpCircle,
  Send,
  BookOpen,
  Home,
  Recycle,
  Search,
  Loader2,
  Building,
  Lock,
  AlertCircle,
} from 'lucide-react';
import type { PageKey, Project, SiteAnalysisData } from '../types';
import Card from '../components/Card';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';

interface HomePageProps {
  onNavigate: (page: PageKey) => void;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onAnalysisComplete: (address: string, data: SiteAnalysisData, projectName: string) => void;
}

// ── Mock data ────────────────────────────────────────────────
const insights = [
  {
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: '건축법 개정 소식',
    desc: '7월부터 다중이용시설의 피난안전 기준이 강화되었습니다.',
  },
  {
    icon: Home,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: '설계 사례 인사이트',
    desc: '중정형 배치로 자연채광을 극대화한 국내외 3가지 사례',
  },
  {
    icon: Recycle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    title: '지속가능한 건축',
    desc: '친환경 건축자재 트렌드와 탄소중립 설계 체크리스트',
  },
];

const recommendTabs = ['채용 공고', '공모전', '행사/교육'] as const;
type RecommendTab = (typeof recommendTabs)[number];

const recommendations: Record<RecommendTab, { org: string; role: string; location: string; dday: number }[]> = {
  '채용 공고': [
    { org: '삼우종합건축사사무소', role: '건축 설계 신입/경력 채용', location: '서울', dday: -7 },
    { org: '정림건축종합건축사사무소', role: 'BIM 설계 경력 채용', location: '서울', dday: -10 },
    { org: '해안종합건축사사무소', role: '건축 설계 인턴 채용', location: '부산', dday: -5 },
  ],
  '공모전': [
    { org: '국토교통부', role: '2026 공공건축 설계공모', location: '전국', dday: -14 },
    { org: '서울시', role: '청년 건축가 아이디어 공모', location: '서울', dday: -21 },
    { org: '한국건축가협회', role: '지역재생 건축 설계 공모', location: '전국', dday: -30 },
  ],
  '행사/교육': [
    { org: '건축도시공간연구소', role: 'BIM 실무 워크숍', location: '서울', dday: -3 },
    { org: '한국건축가협회', role: '친환경 건축 세미나', location: '온라인', dday: -7 },
    { org: '대한건축학회', role: '2026 추계 학술발표대회', location: '대전', dday: -45 },
  ],
};

const chatChips = [
  { icon: Sun, label: '채광과 자연환경' },
  { icon: Wind, label: '동선과 공간 경험' },
  { icon: Map, label: '지역성과 맥락' },
  { icon: BarChart2, label: '사업성과 효율성' },
  { icon: Leaf, label: '친환경과 지속가능성' },
  { icon: HelpCircle, label: '아직 잘 모르겠어요' },
];

// ── Address search (Kakao) ────────────────────────────────────
const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY || '';

const WEBHOOK_URL = 'http://localhost:5678/webhook/trace_studio';

interface AddressSuggestion {
  id: string;
  label: string;
  type: 'road' | 'jibun';
  roadAddress: string;
  jibunAddress: string;
}

export default function HomePage({ onNavigate, projects, onProjectClick, onAnalysisComplete }: HomePageProps) {
  // ── new-project card state ──
  const [projectName, setProjectName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── insights / recommendations state ──
  const [activeTab, setActiveTab] = useState<RecommendTab>('채용 공고');

  // ── chat state ──
  const [chatInput, setChatInput] = useState('');

  // ── analysis state ──
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── address search ──
  const searchAddress = useCallback(async (keyword: string) => {
    if (!keyword.trim() || keyword.length < 2 || !KAKAO_REST_API_KEY) {
      setSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(
        `${KAKAO_API_URL}?query=${encodeURIComponent(keyword)}&size=8`,
        { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } },
      );
      if (!res.ok) { setSuggestions([]); return; }
      const data = await res.json();
      const docs: Array<Record<string, unknown>> = data.documents || [];
      const results: AddressSuggestion[] = [];
      for (const doc of docs) {
        const road = (doc.road_address as any)?.address_name || '';
        const jibun = (doc.address as any)?.address_name || '';
        if (road && (doc.road_address as any)?.main_building_no) {
          results.push({ id: `${road}-road`, label: road, type: 'road', roadAddress: road, jibunAddress: jibun });
        }
        if (jibun && (doc.address as any)?.main_address_no) {
          results.push({ id: `${jibun}-jibun`, label: jibun, type: 'jibun', roadAddress: road, jibunAddress: jibun });
        }
      }
      const seen = new Set<string>();
      setSuggestions(results.filter(r => { const k = `${r.type}-${r.label}`; if (seen.has(k)) return false; seen.add(k); return true; }));
      setShowDropdown(true);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedAddress(null);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => searchAddress(val), 300);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = (s: AddressSuggestion) => {
    setSelectedAddress(s.label);
    setQuery(s.label);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(p => (p + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(p => (p - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSelect(suggestions[activeIndex]); }
    else if (e.key === 'Escape') setShowDropdown(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleStartAnalysis = async () => {
    if (!selectedAddress) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: projectName.trim(), address: selectedAddress }),
      });

      let data: SiteAnalysisData | null = null;
      try {
        data = (await response.json()) as SiteAnalysisData;
      } catch {
        // response body is not JSON
      }

      if (!response.ok) {
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(String((data as Record<string, unknown>).error));
        } else if (data && typeof data === 'object' && 'message' in data) {
          throw new Error(String((data as Record<string, unknown>).message));
        } else {
          throw new Error(`요청 실패 (${response.status})`);
        }
      }

      if (!data) {
        throw new Error('응답을 받지 못했습니다');
      }

      onAnalysisComplete(selectedAddress, data, projectName.trim());
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleChatSend = () => {
    if (chatInput.trim()) onNavigate('site-analysis');
  };

  const handleChipClick = (label: string) => {
    setChatInput(label);
  };

  return (
    <div className="animate-fade-in px-5 lg:px-8 py-8 space-y-7 max-w-[1400px]">

      {/* ── Section 1: Recent Projects ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-gray-900">진행 중 프로젝트</h2>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            전체 보기 <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {projects.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-[14px] font-medium text-gray-400">아직 프로젝트가 없습니다</p>
            <p className="text-[13px] text-gray-300 mt-1">새 프로젝트를 시작해보세요</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => onProjectClick(p)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: Three cards ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Card A: 새 프로젝트 · 대지분석 */}
        <Card className="p-6 lg:col-span-1 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900">새 프로젝트 · 대지분석 시작하기</h3>
            </div>
            <p className="text-[12px] text-gray-400 ml-9 leading-relaxed">
              프로젝트 정보를 입력하면 법규·입지·일조·환경을 한 번에 분석해드려요.
            </p>
          </div>

          {/* Project name */}
          <div className="mt-6">
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">프로젝트명</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="예) 천안 근린생활시설 신축 계획"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
          </div>

          {/* Address search */}
          <div ref={containerRef} className="relative">
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">주소 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                placeholder="도로명 주소 또는 지번으로 검색하세요"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-500 animate-spin" />
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl border border-gray-100 shadow-soft-lg overflow-hidden animate-fade-in-down max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => {
                  const Icon = s.type === 'road' ? Building : Home;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(s)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors ${i === activeIndex ? 'bg-brand-50' : 'hover:bg-gray-50'} ${i > 0 ? 'border-t border-gray-50' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${s.type === 'road' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                        <Icon className={`w-3 h-3 ${s.type === 'road' ? 'text-blue-500' : 'text-amber-600'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{s.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {s.type === 'road' ? `지번: ${s.jibunAddress}` : `도로명: ${s.roadAddress}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error */}
          {analysisError && (
            <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-600 font-medium">{analysisError}</p>
            </div>
          )}

          {/* CTA */}
          <Button
            size="lg"
            fullWidth
            disabled={!selectedAddress || analysisLoading}
            onClick={handleStartAnalysis}
            icon={analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            className="mt-auto"
          >
            {analysisLoading ? '분석 중...' : '대지 분석 시작하기'}
          </Button>
        </Card>

        {/* Card B: 오늘의 인사이트 */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">오늘의 인사이트</h3>
              <p className="text-[11px] text-gray-400">AI가 선별한 오늘의 건축·설계 인사이트</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {insights.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group w-full"
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center mt-0.5`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{item.title}</p>
                    <p className="text-[12px] text-gray-400 leading-relaxed line-clamp-2">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-brand-500 flex-shrink-0 mt-1 transition-colors" />
                </button>
              );
            })}
          </div>

          <button className="text-[12px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
            모든 인사이트 보기 <ArrowRight className="w-3 h-3" />
          </button>
        </Card>

        {/* Card C: 오늘의 추천 */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">오늘의 추천</h3>
              <p className="text-[11px] text-gray-400">취업·공모전·행사 등 맞춤 정보를 확인하세요</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-100">
            {recommendTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${activeTab === tab ? 'bg-white shadow-soft text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex flex-col gap-2.5 flex-1">
            {recommendations[activeTab].map((item, i) => (
              <button
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left w-full group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-800 truncate">{item.org}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-gray-400">{item.location}</p>
                  <p className="text-[11px] font-medium text-brand-500">D{item.dday}</p>
                </div>
              </button>
            ))}
          </div>

          <button className="text-[12px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors">
            모든 채용 정보 보기 <ArrowRight className="w-3 h-3" />
          </button>
        </Card>
      </section>

      {/* ── Section 3: AI Chat ── */}
      <section>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">AI와 대화하기</h3>
              <p className="text-[12px] text-gray-400">프로젝트를 시작하기 전에, 몇 가지 질문을 통해 당신의 방향을 이해해요.</p>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {chatChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  onClick={() => handleChipClick(chip.label)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[12px] font-medium transition-all ${chatInput === chip.label ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="relative">
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
              rows={3}
              placeholder={`또는, 지금 당신의 고민을 자유롭게 이야기해 주세요.\n예) 도로가 너무 좁아서 걱정돼요. 주변 맥락을 어떻게 녹일 수 있을까요?`}
              className="w-full px-4 py-3.5 pr-14 rounded-2xl border border-gray-200 text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none leading-relaxed"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
              className="absolute right-3 bottom-3 w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-1.5 mt-3">
            <Lock className="w-3 h-3 text-gray-300" />
            <p className="text-[11px] text-gray-300">
              대화 내용은 안전하게 보호되며, 당신의 설계 방향을 더 잘 이해하기 위해 활용됩니다.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
