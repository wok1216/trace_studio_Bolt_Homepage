import type { Project } from './types';

const STORAGE_KEY = 'arch_assistant_projects';
const CHAT_STORAGE_KEY = 'arch_assistant_chat_history';
const DESIGN_NOTE_STORAGE_KEY = 'arch_assistant_design_notes';

export interface ProjectChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

function loadAllChatHistories(): Record<string, ProjectChatMessage[]> {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ProjectChatMessage[]>;
  } catch {
    return {};
  }
}

export function loadChatHistory(projectId: string): ProjectChatMessage[] {
  if (!projectId) return [];
  return loadAllChatHistories()[projectId] ?? [];
}

export function saveChatHistory(projectId: string, messages: ProjectChatMessage[]): void {
  if (!projectId) return;
  try {
    const all = loadAllChatHistories();
    all[projectId] = messages;
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

export function deleteChatHistory(projectId: string): void {
  if (!projectId) return;
  try {
    const all = loadAllChatHistories();
    delete all[projectId];
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

function loadAllDesignNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(DESIGN_NOTE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function loadDesignNote(projectId: string): string {
  if (!projectId) return '';
  return loadAllDesignNotes()[projectId] ?? '';
}

export function saveDesignNote(projectId: string, note: string): void {
  if (!projectId) return;
  try {
    const all = loadAllDesignNotes();
    all[projectId] = note;
    localStorage.setItem(DESIGN_NOTE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}

export function deleteDesignNote(projectId: string): void {
  if (!projectId) return;
  try {
    const all = loadAllDesignNotes();
    delete all[projectId];
    localStorage.setItem(DESIGN_NOTE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // ignore storage errors
  }
}
