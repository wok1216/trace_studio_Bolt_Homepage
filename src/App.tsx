import { useState, useEffect } from 'react';
import {
  Images,
  PenTool,
  ClipboardCheck,
} from 'lucide-react';
import type { PageKey, Project, SiteAnalysisData } from './types';
import { loadProjects, addProject, deleteProject, generateId } from './storage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import SiteAnalysisPage from './pages/SiteAnalysisPage';
import SiteResultPage from './pages/SiteResultPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import PlaceholderPage from './pages/PlaceholderPage';

function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    address: string;
    data: SiteAnalysisData;
    projectName: string;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  function navigate(p: PageKey) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAnalysisComplete(address: string, data: SiteAnalysisData, projectName: string) {
    setCurrentAnalysis({ address, data, projectName });
    navigate('site-result');
  }

  function handleSaveProject() {
    if (!currentAnalysis) return;
    const project: Project = {
      id: generateId(),
      name: currentAnalysis.projectName.trim() || `대지 분석 — ${currentAnalysis.address.slice(0, 15)}`,
      address: currentAnalysis.address,
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      analysisData: currentAnalysis.data,
    };
    const updated = addProject(project);
    setProjects(updated);
    setSelectedProject(project);
    navigate('projects');
  }

  function handleProjectClick(project: Project) {
    if (project.analysisData) {
      setSelectedProject(project);
      navigate('project-detail');
    } else {
      navigate('site-analysis');
    }
  }

  async function handleDeleteProject(projectName: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5678/webhook/delete_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName }),
      });
      if (!response.ok) return false;
      const updated = deleteProject(selectedProject!.id);
      setProjects(updated);
      setSelectedProject(null);
      return true;
    } catch {
      return false;
    }
  }

  const pageTitles: Record<PageKey, string> = {
    home: '',
    'site-analysis': '대지 분석',
    reference: '레퍼런스',
    design: '시안 생성',
    review: '설계 검토',
    projects: '프로젝트',
    'site-result': '대지 분석 결과',
    'project-detail': '프로젝트 상세',
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomePage
            onNavigate={navigate}
            projects={projects}
            onProjectClick={handleProjectClick}
            onAnalysisComplete={handleAnalysisComplete}
          />
        );

      case 'site-analysis':
        return (
          <SiteAnalysisPage
            onNavigate={navigate}
            onAnalysisComplete={handleAnalysisComplete}
          />
        );

      case 'site-result':
        if (!currentAnalysis) {
          navigate('home');
          return null;
        }
        return (
          <SiteResultPage
            address={currentAnalysis.address}
            data={currentAnalysis.data}
            onNavigate={navigate}
            onSave={handleSaveProject}
          />
        );

      case 'project-detail':
        if (!selectedProject) {
          navigate('projects');
          return null;
        }
        return (
          <ProjectDetailPage
            name={selectedProject.name}
            address={selectedProject.address}
            date={selectedProject.date}
            data={selectedProject.analysisData as SiteAnalysisData}
            onNavigate={navigate}
            onDelete={handleDeleteProject}
          />
        );

      case 'projects':
        return (
          <ProjectsPage
            projects={projects}
            onNavigate={navigate}
            onProjectClick={handleProjectClick}
          />
        );

      case 'reference':
        return (
          <PlaceholderPage
            icon={Images}
            title="레퍼런스 추천"
            subtitle="Pinterest / ArchDaily"
            desc="프로젝트에 맞는 레퍼런스를 AI가 추천해드립니다"
            actionLabel="레퍼런스 탐색"
            onAction={() => navigate('site-analysis')}
          />
        );

      case 'design':
        return (
          <PlaceholderPage
            icon={PenTool}
            title="시안 생성"
            subtitle="AI 디자인 방향 + 레이아웃"
            desc="AI가 설계 방향과 레이아웃 시안을 생성합니다"
            actionLabel="시안 생성하기"
            onAction={() => navigate('site-analysis')}
          />
        );

      case 'review':
        return (
          <PlaceholderPage
            icon={ClipboardCheck}
            title="설계 검토"
            subtitle="법규 및 체크리스트"
            desc="관련 법규와 설계 체크리스트를 검토합니다"
            actionLabel="설계 검토 시작"
            onAction={() => navigate('site-analysis')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        current={page}
        onNavigate={navigate}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          onMenuClick={() => setMobileSidebarOpen(true)}
          title={pageTitles[page] || undefined}
        />
        <main className="flex-1">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;
