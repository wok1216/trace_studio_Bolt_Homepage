import { useState, useEffect } from 'react';
import {
  Images,
  PenTool,
  ClipboardCheck,
} from 'lucide-react';
import type { PageKey, Project, SiteAnalysisData } from './types';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import SiteAnalysisPage from './pages/SiteAnalysisPage';
import SiteResultPage from './pages/SiteResultPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AnalysisLoading from "./components/AnalysisLoading";

function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    address: string;
    data: SiteAnalysisData;
  } | null>(null);

  useEffect(() => {
  loadProjects();
}, []);

async function loadProjects() {
    try {
      const response = await fetch('http://localhost:5678/webhook/get_projects');
      if (!response.ok) return;

      // 1. 응답 텍스트를 받아 비어있는지 안전하게 검사
      const text = await response.text();
      if (!text) {
        setProjects([]);
        return;
      }

      // 2. JSON 파싱
      const result = JSON.parse(text);
      console.log(result);

      // 3. 기존 데이터 매핑 로직 유지
      const projectsArray = result.projects ?? (Array.isArray(result) ? result : []);

      setProjects(
        projectsArray.map((p: any) => ({
          id: p.id,
          name: p.project_name || p.name,
          address: p.address,
          date: p.created_at || p.date,
          analysisData: {
            ...p,
          },
        }))
      );
    } catch (err) {
      console.error("프로젝트 목록 로드 오류:", err);
    }
  }

useEffect(() => {
  loadProjects();
}, []);

  function navigate(p: PageKey) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

function handleAnalysisComplete(
    address: string,
    data: SiteAnalysisData,
) {
  setCurrentAnalysis({
    address,
    data,
  });

  navigate("site-result");
}

async function handleSaveProject(project: { id: string; name: string }) {
  if (!currentAnalysis) return;

  setSelectedProject({
    id: project.id,
    name: project.name,
    address: currentAnalysis.address,
    date: new Date().toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    analysisData: currentAnalysis.data,
  });

  setProjects(prev => [
  {
    id: project.id,
    name: project.name,
    address: currentAnalysis.address,
    date: new Date().toLocaleDateString("ko-KR"),
    analysisData: currentAnalysis.data,
  },
  ...prev,
]);


  navigate("project-detail");
}

async function handleProjectClick(project: Project) {
   setSelectedProject(project);
   navigate("project-detail");
}

  async function handleDeleteProject(projectId: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5678/webhook/delete_project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!response.ok) return false;
      setProjects(prev => prev.filter(project => project.id !== projectId));
      await loadProjects();
      setSelectedProject(null);
      return true;
    } catch {
      return false;
    }
  }

  const pageTitles: Record<PageKey, string> = {
    home: '',
    'analysis-loading': '분석 중',
    'site-analysis': '대지 분석',
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

case "analysis-loading":
    return <AnalysisLoading />;

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
            id={selectedProject.id}
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
