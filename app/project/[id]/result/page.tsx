"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CaseStudyPreview,
  extractSynthesisMetadata,
  type SynthesisFrameworkMeta,
} from "@/components/CaseStudyPreview";
import { GlassNav } from "@/components/GlassNav";
import { getProject, saveProject } from "@/lib/storage/projects";
import type { Project } from "@/lib/storage/projects";

const DEFAULT_DOCUMENT_TITLE = "UX Portfolio Questionnaire";

const FRAMEWORK_DISPLAY: Record<string, string> = {
  Prescriptive: "Prescriptive Narrative",
  Hero: "Hero Journey",
  FamiliarToForeign: "Familiar to Foreign",
  Framed: "Framed Narrative",
  Layered: "Layered Narrative",
  ContextualInterlude: "Contextual Interlude",
};

export default function ProjectResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [project, setProject] = useState<Project | null>(null);
  const [content, setContent] = useState("");
  const [frameworkMeta, setFrameworkMeta] = useState<SynthesisFrameworkMeta | null>(
    null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const hasFetched = useRef(false);

  const persistContent = useCallback(
    (newContent: string, newMeta?: SynthesisFrameworkMeta) => {
      if (!id) return;
      const p = getProject(id);
      if (p) {
        saveProject({
          ...p,
          synthesizedContent: newContent,
          synthesisMeta: newMeta ?? p.synthesisMeta,
        });
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
        setFrameworkMeta(
          local.synthesisMeta ??
            extractSynthesisMetadata(local.synthesizedContent).frameworkMeta
        );
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
          const parsedMeta = extractSynthesisMetadata(full).frameworkMeta;
          setFrameworkMeta(parsedMeta);
          persistContent(full, parsedMeta);
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
          if (data.synthesizedContent) {
            setFrameworkMeta(
              data.synthesisMeta ??
                extractSynthesisMetadata(data.synthesizedContent).frameworkMeta
            );
          }
        }
      })
      .catch(() => router.push("/"));
  }, [id, router, persistContent]);

  useEffect(() => {
    const displayTitle = projectName.trim() || "Case Study";
    document.title = displayTitle;
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [projectName]);

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
        <h1 className="mb-4 text-2xl font-bold tracking-tighthead text-ink">
          {projectName || "Case Study"}
        </h1>
        {frameworkMeta && (
          <section className="mb-8 rounded-[28px] border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-accent-lavender/25 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              Storytelling Framework
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              {FRAMEWORK_DISPLAY[frameworkMeta.selectedFramework] ??
                frameworkMeta.selectedFramework}
              {frameworkMeta.isInferred ? " (Inferred)" : ""}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              {frameworkMeta.frameworkRationale ||
                "Framework metadata is unavailable. Showing inferred framework from synthesized output."}
            </p>
            {frameworkMeta.plotBeats.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {frameworkMeta.plotBeats.slice(0, 6).map((beat, index) => (
                  <span
                    key={`${beat.beat}-${index}`}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-medium text-primary/90"
                    title={beat.evidence}
                  >
                    {beat.beat}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

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
          <CaseStudyPreview
            content={content}
            isStreaming={isStreaming}
            traceAndExecution={
              project && "traceAndExecution" in project.answers
                ? project.answers.traceAndExecution
                : null
            }
          />
        )}
      </main>
    </div>
  );
}
