"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, deleteProject } from "@/lib/storage/projects";
import type { Project } from "@/lib/storage/projects";

type LoadState = "loading" | "owner" | "shared" | "notfound";

export default function ProjectHubPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [state, setState] = useState<LoadState>("loading");
  const [project, setProject] = useState<Project | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const local = getProject(id);
    if (local) {
      setProject(local);
      setState("owner");
      return;
    }

    fetch(`/api/project/${id}`)
      .then((res) => {
        if (res.ok) return res.json();
        setState("notfound");
      })
      .then((data) => {
        if (data) {
          setProject(data);
          setState("shared");
        }
      })
      .catch(() => setState("notfound"));
  }, [id]);

  const handleShare = useCallback(() => {
    if (!project) return;
    setShareError(null);
    fetch("/api/project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to share");
        const url = `${window.location.origin}/project/${data.id}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url).catch(() => {});
      })
      .catch((err) => setShareError(err instanceof Error ? err.message : "Failed to share"));
  }, [project]);

  const handleDelete = useCallback(() => {
    if (!id || state !== "owner") return;
    if (confirm("Delete this project?")) {
      deleteProject(id);
      router.push("/");
    }
  }, [id, state, router]);

  if (!id) return null;

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-stone-600">Loading...</p>
      </div>
    );
  }

  if (state === "notfound") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6">
        <p className="text-lg text-stone-700">Project not found</p>
        <Link href="/" className="mt-4 text-sm font-medium text-stone-600 hover:text-stone-900">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const name =
    project!.answers.projectOverview.projectName || project!.name || "Untitled Project";

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            ← Projects
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-bold text-stone-900">{name}</h1>

        {state === "owner" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/project/${id}/edit`}
                className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                Edit questionnaire
              </Link>
              {project!.synthesizedContent ? (
                <Link
                  href={`/project/${id}/result`}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  View case study
                </Link>
              ) : (
                <Link
                  href={`/project/${id}/edit`}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-500"
                >
                  Complete questionnaire to generate case study
                </Link>
              )}
              <button
                onClick={handleShare}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Share link
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
            {shareUrl && (
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-sm font-medium text-stone-700">Shareable link (copied to clipboard)</p>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="mt-2 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-700"
                />
                <button
                  onClick={() => setShareUrl(null)}
                  className="mt-2 text-sm text-stone-500 hover:text-stone-700"
                >
                  Dismiss
                </button>
              </div>
            )}
            {shareError && (
              <p className="text-sm text-red-600">{shareError}</p>
            )}
          </div>
        )}

        {state === "shared" && (
          <div>
            {project!.synthesizedContent ? (
              <Link
                href={`/project/${id}/result`}
                className="inline-block rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
              >
                View case study
              </Link>
            ) : (
              <p className="text-stone-600">This project has no case study yet.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
