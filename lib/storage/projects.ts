import type { QuestionnaireAnswers } from "@/lib/questionnaire/schema";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  answers: QuestionnaireAnswers;
  synthesizedContent: string;
}

const STORAGE_KEY = "ux-portfolio-projects";

const SHORT_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateShortId(): string {
  const array = new Uint8Array(8);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (b) => SHORT_ID_CHARS[b % 36]).join("");
}

function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Failed to save projects:", e);
  }
}

export function listProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const projects = getProjects();
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

export function createProject(): Project {
  const id = generateShortId();
  const project: Project = {
    id,
    name: "Untitled Project",
    createdAt: new Date().toISOString(),
    answers: {
      projectOverview: { projectName: "", clientContext: "", timeline: "" },
      problemAndGoals: { problem: "", targetUsers: "", successCriteria: "", files: [] },
      process: { research: "", ideation: "", iteration: "", keyDecisions: "", files: [] },
      solution: { finalDesign: "", rationale: "", tradeoffs: "", files: [] },
      impactAndLearnings: { metrics: "", feedback: "", personalLearnings: "", files: [] },
      roleAndCollaboration: { contribution: "", teamSize: "", stakeholders: "" },
    },
    synthesizedContent: "",
  };
  saveProject(project);
  return project;
}
