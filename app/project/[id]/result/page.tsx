"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CaseStudyPreview } from "@/components/CaseStudyPreview";
import { GlassNav } from "@/components/GlassNav";
import { getProject, saveProject } from "@/lib/storage/projects";
import type { Project } from "@/lib/storage/projects";

export default function ProjectResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const hasFetched = useRef(false);

  const persistContent = useCallback(
    (newContent: string) => {
      if (!id) return;
      const p = getProject(id);
      if (p) {
        saveProject({ ...p, synthesizedContent: newContent });
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const local = getProject(id);
    if (local) {
      setProject(local);
      setIsOwner(true);
      setProjectName(
        local.answers.projectOverview.projectName || local.name
      );
      if (local.synthesizedContent) {
        setContent(local.synthesizedContent);
        return;
      }
      if (hasFetched.current) return;
      hasFetched.current = true;
      setIsStreaming(true);
      fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: local.answers }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response body");
          const decoder = new TextDecoder();
          let full = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            full += decoder.decode(value, { stream: true });
            setContent(full);
          }
          persistContent(full);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to generate");
        })
        .finally(() => setIsStreaming(false));
      return;
    }

    fetch(`/api/project/${id}`)
      .then((res) => {
        if (!res.ok) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((data: Project | null) => {
        if (data) {
          setProject(data);
          setIsOwner(false);
          setProjectName(
            data.answers.projectOverview.projectName || data.name
          );
          setContent(data.synthesizedContent || "");
        }
      })
      .catch(() => router.push("/"));
  }, [id, router, persistContent]);

  if (!id) return null;

  if (!project && !content && !isStreaming) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-ink/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNav>
        <Link
          href={isOwner ? `/project/${id}` : "/"}
          className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          {isOwner ? "← Project" : "← Home"}
        </Link>
        {isOwner && (
          <div className="flex gap-3">
            <Link href={`/project/${id}/edit`} className="btn-secondary">
              Edit
            </Link>
            <Link href="/showcase" className="btn-primary">
              Create Showcase
            </Link>
          </div>
        )}
      </GlassNav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-bold tracking-tighthead text-ink">
          {projectName || "Case Study"}
        </h1>

        {error && (
          <div className="rounded-[32px] border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
            <p className="mt-2 text-sm">
              Make sure OPENAI_API_KEY is set in .env.local
            </p>
          </div>
        )}

        {!isOwner && !content && project ? (
          <p className="text-ink/60">This project has no case study yet.</p>
        ) : (
          <CaseStudyPreview content={content} isStreaming={isStreaming} />
        )}
      </main>
    </div>
  );
}
