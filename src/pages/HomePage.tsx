import { useState, useRef, useCallback, useEffect } from 'react';
import {
  MapPin,
  ArrowRight,
  Lightbulb,
  Briefcase,
  Home,
  Search,
  Loader2,
  Building,
  AlertCircle,
} from 'lucide-react';
import type { PageKey, Project, SiteAnalysisData } from '../types';
import Card from '../components/Card';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';
import AnalysisLoading from '../components/AnalysisLoading';

interface HomePageProps {
  onNavigate: (page: PageKey) => void;
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onAnalysisComplete: (address: string, data: SiteAnalysisData) => void;
}

// ── Address search (Kakao) ────────────────────────────────────
const KAKAO_API_URL = 'https://dapi.kakao.com/v2/local/search/address.json';
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY || '';

const WEBHOOK_URL = 'http://localhost:5678/webhook/trace_studio';
const JOB_LIST_URL = 'http://localhost:5678/webhook/job_list';
const EVENT_URL = 'http://localhost:5678/webhook/event_list';

interface AddressSuggestion {
  id: string;
  label: string;
  type: 'road' | 'jibun';
  roadAddress: string;
  jibunAddress: string;
}

export default function HomePage({ onNavigate, projects, onProjectClick, onAnalysisComplete }: HomePageProps) {
  // ── new-project card state ──
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [jobList, setJobList] = useState<any[]>([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [hasArchitecture, setHasArchitecture] = useState(true);
  const [contestList, setContestList] = useState<any[]>([]);
  const [educationList, setEducationList] = useState<any[]>([]);
  const [eventList, setEventList] = useState<any[]>([]);
  const [cultureTab, setCultureTab] = useState('contest');

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

  useEffect(() => () => { 
    if (debounceRef.current) clearTimeout(debounceRef.current);
   }, []);

   useEffect(() => {
      console.log("Home useEffect");
      console.log("loadJobs 실행");
      console.log("loadEvents 실행");
      console.log(EVENT_URL);

    const loadEvents = async () => {
      console.log("loadEvents 함수 진입");
      
      try {
        const response = await fetch(EVENT_URL,{
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          }
        });

const data = await response.json();

console.log(data);

const result = Array.isArray(data)
  ? data[0]
  : data;

setContestList(result?.contests ?? []);
setEventList(result?.events ?? []);
setEducationList(result?.education ?? []);

  } catch(err){
    console.error(err);
  }

};

  const loadJobs = async () => {
    try {
      setJobLoading(true);

      const response = await fetch(JOB_LIST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jobs = await response.json();
      
      console.log("response.ok =", response.ok);
      console.log("job api =", jobs);
      
const list = Array.isArray(jobs)
  ? jobs
  : [];
      
      setJobList(list);
      
      console.log("jobList length =", list.length);
      
      setJobList(list);
    } catch (err) {
      console.error(err);
    } finally {
      setJobLoading(false);
    }
  };

  loadJobs();
  console.log("loadEvents 호출");
  loadEvents();

}, []);

  const handleStartAnalysis = async () => {

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: selectedAddress }),
      });

      let data: SiteAnalysisData | null = null;
      try {
        data = (await response.json()) as SiteAnalysisData;

        console.log("Is Array:", Array.isArray(data));
        console.log(data);
        console.log(JSON.stringify(data, null, 2));

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

      const result = Array.isArray(data) ? data[0] : data;
      
      console.log("Result:", result);
      
      onAnalysisComplete(
        selectedAddress!,
        data
      );

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

if (analysisLoading) {
  return <AnalysisLoading />;
}

  return (
    <div className="animate-fade-in px-5 lg:px-8 py-8 space-y-7 max-w-[1400px]">

      {/* ── Section 2: Three cards ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Card A: 대지분석 */}
        <Card className="p-6 lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center ">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">
                대지분석 시작하기
              </h3>

    <p className="text-[11px] text-gray-400">
      주소를 입력하면 대지를 한 번에 분석해드려요.
    </p>
  </div>
</div>


          {/* Address search */}
          <div ref={containerRef} className="relative">
            <label className="block text-[12px] font-semibold text-gray-600 mb-1.5">주소 검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                required
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                placeholder="주소를 입력하세요 (예: 강남구 테헤란로 123)"
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
            disabled={analysisLoading }
            onClick={handleStartAnalysis}
            icon={analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            className="mt-auto"
          >
            {analysisLoading ? '분석 중...' : '대지 분석 시작하기'}
          </Button>
        </Card>

        {/* Card B: 오늘의 건축정보 */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">오늘의 건축정보</h3>
              <p className="text-[11px] text-gray-400">공모전·대외활동·교육 정보를 확인하세요.</p>
            </div>
          </div>
          
          <div className="flex gap-1 p-1 rounded-xl bg-gray-50 border border-gray-100">

<button
  onClick={() => setCultureTab("contest")}
  className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
    cultureTab === "contest"
      ? "bg-white shadow-soft text-gray-900"
      : "text-gray-400 hover:text-gray-600"
  }`}
>
  공모전
</button>

<button
  onClick={() => setCultureTab("event")}
  className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
    cultureTab === "event"
      ? "bg-white shadow-soft text-gray-900"
      : "text-gray-400 hover:text-gray-600"
  }`}
>
  대외활동
</button>

<button
  onClick={() => setCultureTab("education")}
  className={`flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all ${
    cultureTab === "education"
      ? "bg-white shadow-soft text-gray-900"
      : "text-gray-400 hover:text-gray-600"
  }`}
>
  교육
</button>

</div>

<div className="flex flex-col gap-1 mt-3">
  {(() => {
    const cultureList =
      cultureTab === "contest"
        ? contestList
        : cultureTab === "event"
        ? eventList
        : educationList;

    return cultureList.map((item: any, i: number) => (
      <button
        key={i}
        onClick={() => window.open(item.url, "_blank")}
        className="flex items-center gap-1 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left w-full"
      >
<div className="flex justify-between items-start">
  <div className="flex-1 min-w-0">
    <p className="text-[13px] font-semibold text-gray-800 line-clamp-2">
      {item.title}
    </p>

    <p className="text-[11px] text-gray-400 mt-1">
      {item.period}
    </p>
  </div>

  <span className="text-[11px] text-gray-400 whitespace-nowrap self-start ml-2">
    {item.region}
  </span>
</div>
      </button>
    ));
  })()}
</div>

        </Card>

        {/* Card C: 오늘의 채용공고 */}
        <Card className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 -mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">오늘의 채용공고</h3>
              <p className="text-[11px] text-gray-400">채용정보를 확인하세요</p>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-1 flex mt-3">
            {!hasArchitecture && (
                  <div className="mb-1 rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5 flex flex-col items-center justify-center text-center">
                   <p className="text-[11px] font-medium text-gray-500">
                건축 관련 공고가 없어 공공기관 채용을 표시합니다.
                  </p>
                   </div>
                  )}
{jobList.slice(0, 4).map((job) => (

<button
  key={job.link}
  onClick={() => window.open(job.link, "_blank")}
  className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-gray-800 truncate">
        {job.company}
      </p>

      <p className="text-[11px] text-gray-400 truncate">
        {job.career}
      </p>
    </div>

    <div className="text-right flex-shrink-0 pr-2">
      <p className="text-[11px] font-medium text-brand-500">
        {job.dday}
      </p>
    </div>
  </button>
))}

<button
  onClick={() => window.open("https://vmspace.com/job/job.html", "_blank")}
  className="mt-1 ml-auto pr-3 text-[12px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
>
  건축 채용공고 더보기
  <ArrowRight className="w-3 h-3" />
</button>

          </div>

        </Card>
      </section>

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



    </div>
  );
}
