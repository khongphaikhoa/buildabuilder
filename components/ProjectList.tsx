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

  const projectCount = projects.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="nav-glass">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tighthead text-ink">
              UX Portfolio Questionnaire
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Create case studies from your project notes
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link href="/showcase" className="btn-secondary">
              Create Showcase
            </Link>
            <button type="button" onClick={handleCreate} className="btn-primary">
              New Project
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-12">
        <section className="text-center">
          <span className="inline-flex rounded-full border border-gray-100 bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            Join 10k+ learners
          </span>
          <h2 className="mt-6 text-4xl font-bold tracking-tighthead text-ink sm:text-5xl">
            Turn notes into portfolio-ready case studies
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-ink/60">
            Answer guided prompts, upload context, and export polished narratives—without staring at a blank page.
          </p>
        </section>

        <div className="mt-14 grid grid-cols-12 gap-4 md:gap-6">
          {/* Stats */}
          <div className="col-span-12 flex h-full flex-col justify-between rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 md:col-span-4">
            <p className="text-sm font-medium text-ink/60">Your projects</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-ink">{projectCount}</p>
            <p className="mt-2 text-xs text-ink/50">Stored locally in this browser</p>
          </div>
          <div className="col-span-12 flex h-full flex-col justify-between rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 md:col-span-4">
            <p className="text-sm font-medium text-ink/60">Guided sections</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-ink">12+</p>
            <p className="mt-2 text-xs text-ink/50">Structured prompts across the flow</p>
          </div>
          <div className="col-span-12 flex h-full flex-col justify-between rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 md:col-span-4">
            <p className="text-sm font-medium text-ink/60">Export ready</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-ink">1-click</p>
            <p className="mt-2 text-xs text-ink/50">Case study & showcase links</p>
          </div>

          {/* Feature 8 + 4 */}
          <div className="col-span-12 md:col-span-8">
            <div className="card-bento h-full">
              <div>
                <span className="bento-tag">Workflow</span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-ink">
                  Structured storytelling
                </h3>
                <p className="mt-3 leading-relaxed text-ink/60">
                  Move from problem framing to outcomes with prompts tuned for UX portfolios—so reviewers see the full arc.
                </p>
              </div>
              <div className="mt-8 border-t border-gray-50 pt-6">
                <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-accent-lavender to-white" />
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="card-bento h-full">
              <div>
                <span className="bento-tag">Context</span>
                <h3 className="mt-6 text-2xl font-bold tracking-tight text-ink">
                  Rich inputs
                </h3>
                <p className="mt-3 leading-relaxed text-ink/60">
                  Attach screenshots and files so your write-up matches what you actually shipped.
                </p>
              </div>
              <div className="mt-8 border-t border-gray-50 pt-6">
                <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-accent-mint to-white" />
              </div>
            </div>
          </div>

          {/* Spotlight */}
          <div className="col-span-12">
            <div className="flex flex-col justify-between gap-8 rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0 md:flex-row md:items-center">
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold tracking-tighthead text-ink">
                  One flow from messy notes to interview-ready case study
                </h3>
                <p className="mt-3 text-ink/60">
                  Generate a synthesized narrative, refine in place, then share a link or bundle projects into a showcase page.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <button type="button" onClick={handleCreate} className="btn-primary px-6 py-3 text-base">
                  Start a project
                </button>
                <Link href="/showcase" className="btn-secondary px-6 py-3 text-base">
                  Build a showcase
                </Link>
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="col-span-12">
            <h2 className="mb-6 text-lg font-bold tracking-tighthead text-ink">Your projects</h2>
            {projects.length === 0 ? (
              <div className="rounded-[32px] border-2 border-dashed border-gray-200 bg-white/80 p-12 text-center shadow-sm">
                <p className="text-ink/70">No projects yet</p>
                <p className="mt-2 text-sm text-ink/50">
                  Create your first project to get started
                </p>
                <button type="button" onClick={handleCreate} className="btn-primary mt-6 px-6 py-3 text-base">
                  New Project
                </button>
              </div>
            ) : (
              <ul className="space-y-4">
                {projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/project/${project.id}`}
                      className="card-bento-row group flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">
                          {project.name === "Untitled Project" && project.answers.projectOverview.projectName
                            ? project.answers.projectOverview.projectName
                            : project.name}
                        </p>
                        <p className="mt-1 text-xs text-ink/50">
                          {new Date(project.createdAt).toLocaleDateString()}
                          {project.synthesizedContent && (
                            <span className="ml-2 text-emerald-600">• Complete</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {project.synthesizedContent && (
                          <Link
                            href={`/project/${project.id}/result`}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-full border border-gray-100 bg-white px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-gray-50"
                          >
                            View
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, project.id)}
                          className="rounded-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
