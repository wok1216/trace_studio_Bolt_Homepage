import { useState, useEffect } from 'react';
import {
  Images,
  PenTool,
  ClipboardCheck,
} from 'lucide-react';
import type { PageKey, Project, SiteAnalysisData } from './types';
import {
  loadProjects as loadProjectsFromStorage,
  saveProjects as saveProjectsToStorage,
  deleteChatHistory,
  deleteDesignNote,
} from './storage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import SiteAnalysisPage from './pages/SiteAnalysisPage';
import SiteResultPage from './pages/SiteResultPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AnalysisLoading from "./components/AnalysisLoading";
import { resolveProjectAnalysisData } from './lib/projectAnalysisData';

function App() {
  const [page, setPage] = useState<PageKey>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<{
    address: string;
    data: SiteAnalysisData;
  } | null>(null);

  function normalizeProjects(projects: Project[]): Project[] {
    return projects.map((project) => ({
      ...project,
      analysisData: resolveProjectAnalysisData(project.analysisData, project.address),
    }));
  }

  function mapApiProjects(rawList: unknown[]): Project[] {
    return rawList
      .map((item: any) => {
        const p = item?.json ?? item;
        return {
          id: String(p?.id ?? p?.project_id ?? ''),
          name: p?.project_name || p?.name || '이름 없음',
          address: p?.address || '',
          date: p?.created_at || p?.date || '',
          designNote: p?.design_note || p?.designNote || '',
          analysisData: resolveProjectAnalysisData(p as SiteAnalysisData, p?.address || ''),
        };
      })
      .filter((p) => p.id);
  }

  async function loadProjects() {
    try {
      const response = await fetch('http://localhost:5678/webhook/get_projects');
      if (!response.ok) {
        setProjects(normalizeProjects(loadProjectsFromStorage()));
        return;
      }

      const text = await response.text();
      if (!text) {
        console.warn('[get_projects] API 응답이 비어 있습니다. localStorage 캐시를 사용합니다.');
        setProjects(normalizeProjects(loadProjectsFromStorage()));
        return;
      }

      const result = JSON.parse(text);
      const rawList =
        result.projects ??
        result.data ??
        (Array.isArray(result) ? result : []);

      const mapped = mapApiProjects(rawList);
      if (mapped.length > 0) {
        setProjects(mapped);
        saveProjectsToStorage(mapped);
        return;
      }

      setProjects(normalizeProjects(loadProjectsFromStorage()));
    } catch (err) {
      console.error('프로젝트 목록 로드 오류:', err);
      setProjects(normalizeProjects(loadProjectsFromStorage()));
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

  const newProject: Project = {
    id: project.id,
    name: project.name,
    address: currentAnalysis.address,
    date: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    analysisData: currentAnalysis.data,
  };

  setSelectedProject(newProject);
  setProjects((prev) => {
    const updated = [newProject, ...prev];
    saveProjectsToStorage(updated);
    return updated;
  });

  navigate('project-detail');
}

async function handleProjectClick(project: Project) {
  try {
    const response = await fetch('http://localhost:5678/webhook/get_project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    });

    if (response.ok) {
      const text = await response.text();
      if (text) {
        const data = JSON.parse(text);
        const projectData = Array.isArray(data) ? data[0] : data;
        setSelectedProject({
          id: projectData.id || project.id,
          name: projectData.project_name || projectData.name || project.name,
          address: projectData.address || project.address,
          date: projectData.created_at || projectData.date || project.date,
          analysisData: projectData,
        });
      } else {
        setSelectedProject(project);
      }
    } else {
      setSelectedProject(project);
    }
  } catch (err) {
    console.error('프로젝트 조회 오류:', err);
    setSelectedProject(project);
  }
  navigate('project-detail');
}

  async function handleDeleteProject(projectId: string): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:5678/webhook/delete_project', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      if (!response.ok) return false;
      setProjects((prev) => {
        const updated = prev.filter((project) => project.id !== projectId);
        saveProjectsToStorage(updated);
        return updated;
      });
      deleteChatHistory(projectId);
      deleteChatHistory(`${projectId}_design_memo`);
      deleteDesignNote(projectId);
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
            data={resolveProjectAnalysisData(
              selectedProject.analysisData as SiteAnalysisData,
              selectedProject.address,
            )}
            initialDesignNote={selectedProject.designNote}
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
