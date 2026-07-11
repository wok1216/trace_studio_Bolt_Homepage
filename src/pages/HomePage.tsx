import {
  MapPin,
  Images,
  PenTool,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { PageKey, Project } from '../types';
import Card from '../components/Card';
import ProjectCard from '../components/ProjectCard';

interface HomePageProps {
  onNavigate: (page: PageKey) => void;
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const features = [
  {
    id: 'site',
    icon: MapPin,
    title: '대지 분석',
    subtitle: '주소 기반 대지 분석',
    desc: '주소만 입력하면 AI가 대지 정보를 분석합니다',
    page: 'site-analysis' as PageKey,
    gradient: 'from-blue-50 to-sky-50',
    iconBg: 'bg-brand-500',
  },
  {
    id: 'ref',
    icon: Images,
    title: '레퍼런스 추천',
    subtitle: 'Pinterest / ArchDaily',
    desc: '프로젝트 맞춤형 레퍼런스를 추천합니다',
    page: 'reference' as PageKey,
    gradient: 'from-cyan-50 to-blue-50',
    iconBg: 'bg-cyan-500',
  },
  {
    id: 'design',
    icon: PenTool,
    title: '시안 생성',
    subtitle: 'AI 디자인 방향 + 레이아웃',
    desc: 'AI가 설계 방향과 레이아웃 시안을 생성합니다',
    page: 'design' as PageKey,
    gradient: 'from-sky-50 to-indigo-50',
    iconBg: 'bg-sky-500',
  },
  {
    id: 'review',
    icon: ClipboardCheck,
    title: '설계 검토',
    subtitle: '법규 및 체크리스트',
    desc: '관련 법규와 설계 체크리스트를 검토합니다',
    page: 'review' as PageKey,
    gradient: 'from-blue-50 to-cyan-50',
    iconBg: 'bg-blue-500',
  },
];

export default function HomePage({ onNavigate, projects, onProjectClick }: HomePageProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="px-5 lg:px-10 pt-12 lg:pt-20 pb-10 lg:pb-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-100 mb-6 animate-fade-in-down">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span className="text-[12px] font-medium text-brand-600">AI 건축 워크스페이스</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-5 animate-fade-in-up">
            Arch Assistant
          </h1>
          <p className="text-lg lg:text-xl text-gray-400 font-medium tracking-tight animate-fade-in-up">
            AI Architecture Workspace
          </p>
          <p className="mt-6 text-[15px] lg:text-base text-gray-500 leading-relaxed max-w-2xl animate-fade-in-up">
            대지 분석부터 설계 검토까지, AI와 함께 건축 설계 워크플로우를 시작하세요.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="px-5 lg:px-10 pb-12 lg:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.id}
                hover
                onClick={() => onNavigate(f.page)}
                className={`p-6 animate-fade-in-up`}
              >
                <div
                  className={`inline-flex w-12 h-12 rounded-2xl ${f.iconBg} items-center justify-center mb-5 shadow-sm`}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <h3 className="text-[17px] font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-[13px] text-brand-500 font-medium mb-2">{f.subtitle}</p>
                <p className="text-[13px] text-gray-400 leading-relaxed mb-5">{f.desc}</p>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-brand-600 group-hover:gap-2.5 transition-all">
                  시작하기
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Recent Projects */}
      <section className="px-5 lg:px-10 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900">최근 프로젝트</h2>
        </div>

        {projects.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-[15px] font-medium text-gray-400 mb-1">아직 프로젝트가 없습니다</p>
            
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {projects.slice(0, 8).map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => onProjectClick(p)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
