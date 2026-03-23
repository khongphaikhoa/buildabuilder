"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { QuestionStep } from "@/components/QuestionStep";
import { ProgressBar } from "@/components/ProgressBar";
import { GlassNav } from "@/components/GlassNav";
import { QUESTION_GROUPS, defaultAnswers } from "@/lib/questionnaire/schema";
import { getProject, saveProject, createProject } from "@/lib/storage/projects";
import type { QuestionnaireAnswers } from "@/lib/questionnaire/schema";

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [projectIdState, setProjectIdState] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;

    const project = getProject(id);
    if (project) {
      setProjectIdState(project.id);
      setAnswers(project.answers);
    } else {
      const newProject = createProject();
      setProjectIdState(newProject.id);
      router.replace(`/project/${newProject.id}/edit`);
    }
  }, [id, router]);

  const persistAnswers = useCallback(
    (newAnswers: QuestionnaireAnswers) => {
      if (!projectIdState) return;
      const project = getProject(projectIdState);
      if (project) {
        const name =
          newAnswers.projectOverview.projectName || "Untitled Project";
        saveProject({
          ...project,
          name,
          answers: newAnswers,
        });
      }
    },
    [projectIdState]
  );

  const handleChange = useCallback(
    (newAnswers: QuestionnaireAnswers) => {
      setAnswers(newAnswers);
      persistAnswers(newAnswers);
    },
    [persistAnswers]
  );

  const handleNext = useCallback(() => {
    if (step < QUESTION_GROUPS.length - 1) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      router.push(`/project/${projectIdState}/result`);
    }
  }, [step, projectIdState, router]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.push(id ? `/project/${id}` : "/");
    }
  }, [step, id, router]);

  if (!id) return null;

  if (projectIdState === null) {
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
          href={`/project/${projectIdState}`}
          className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          ← Project
        </Link>
        <ProgressBar current={step + 1} total={QUESTION_GROUPS.length} />
      </GlassNav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <QuestionStep
          sectionIndex={step}
          answers={answers}
          onChange={handleChange}
          onBack={handleBack}
          onNext={handleNext}
          isLast={step === QUESTION_GROUPS.length - 1}
        />
      </main>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20">
          <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-lg">
            <p className="text-ink/80">Redirecting to generate your case study...</p>
          </div>
        </div>
      )}
    </div>
  );
}
