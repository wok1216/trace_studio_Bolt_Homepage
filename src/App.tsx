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
import AnalysisLoading from "./components/AnalysisLoading";

function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    address: string;
    data: SiteAnalysisData;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    setProjects(loadProjects());
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

function handleSaveProject(projectName: string) {
    if (!currentAnalysis) return;

    const project: Project = {
  id: generateId(),
  name: projectName,
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
