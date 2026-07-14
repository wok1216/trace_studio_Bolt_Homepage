import { FolderKanban, ArrowRight } from 'lucide-react';
import type { PageKey, Project } from '../types';
import Card from '../components/Card';
import ProjectCard from '../components/ProjectCard';

interface ProjectsPageProps {
  projects: Project[];
  onNavigate: (page: PageKey) => void;
  onProjectClick: (project: Project) => void;
}

export default function ProjectsPage({ projects, onNavigate, onProjectClick }: ProjectsPageProps) {
  return (
    <div className="animate-fade-in px-5 lg:px-10 py-8 lg:py-12">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight mb-2">
            프로젝트
          </h1>
          <p className="text-[15px] text-gray-400">
            {projects.length > 0 ? `${projects.length}개의 프로젝트` : '저장된 프로젝트를 관리하세요'}
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
            <FolderKanban className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-[16px] font-semibold text-gray-400 mb-1">프로젝트가 없습니다</p>
          <p className="text-[14px] text-gray-300 mb-6">첫 프로젝트를 만들어보세요</p>
          <div
            onClick={() => onNavigate('site-analysis')}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-brand-600 cursor-pointer hover:gap-2.5 transition-all"
          >
            대지 분석 시작하기
            <ArrowRight className="w-4 h-4" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => onProjectClick(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
