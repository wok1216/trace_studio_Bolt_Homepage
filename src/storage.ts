import type { Project } from './types';

const STORAGE_KEY = 'arch_assistant_projects';

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function addProject(project: Project): Project[] {
  const projects = loadProjects();
  const updated = [project, ...projects];
  saveProjects(updated);
  return updated;
}

export function updateProject(id: string, patch: Partial<Project>): Project[] {
  const projects = loadProjects();
  const updated = projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
  saveProjects(updated);
  return updated;
}

export function deleteProject(id: string): Project[] {
  const projects = loadProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.id === id);
}

export function generateId(): string {
  return `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
