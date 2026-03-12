"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Project } from "@/lib/storage/projects";
import { listProjects, deleteProject, createProject } from "@/lib/storage/projects";

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const handleCreate = () => {
    const project = createProject();
    window.location.href = `/project/${project.id}/edit`;
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this project?")) {
      deleteProject(id);
      setProjects(listProjects());
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-stone-900">
          UX Portfolio Questionnaire
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Create case studies from your project notes
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-stone-800">Your Projects</h2>
          <div className="flex gap-3">
            <Link
              href="/showcase"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Create Showcase
            </Link>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              New Project
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="mt-12 rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
            <p className="text-stone-600">No projects yet</p>
            <p className="mt-2 text-sm text-stone-500">
              Create your first project to get started
            </p>
            <button
              onClick={handleCreate}
              className="mt-6 rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
            >
              New Project
            </button>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/project/${project.id}`}
                  className="group flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-stone-300 hover:shadow"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900 truncate">
                      {project.name === "Untitled Project" && project.answers.projectOverview.projectName
                        ? project.answers.projectOverview.projectName
                        : project.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                      {project.synthesizedContent && (
                        <span className="ml-2 text-emerald-600">• Complete</span>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    {project.synthesizedContent && (
                      <Link
                        href={`/project/${project.id}/result`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                      >
                        View
                      </Link>
                    )}
                    <button
                      onClick={(e) => handleDelete(e, project.id)}
                      className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
