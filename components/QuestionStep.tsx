"use client";

import { FileUpload } from "./FileUpload";
import type { QuestionnaireAnswers, QuestionSection } from "@/lib/questionnaire/schema";
import { QUESTION_GROUPS } from "@/lib/questionnaire/schema";

interface QuestionStepProps {
  sectionIndex: number;
  answers: QuestionnaireAnswers;
  onChange: (answers: QuestionnaireAnswers) => void;
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
}

export function QuestionStep({
  sectionIndex,
  answers,
  onChange,
  onBack,
  onNext,
  isLast,
}: QuestionStepProps) {
  const group = QUESTION_GROUPS[sectionIndex];
  if (!group) return null;

  const sectionAnswers = answers[group.id] as Record<string, unknown>;

  const updateField = (key: string, value: string | unknown[]) => {
    onChange({
      ...answers,
      [group.id]: {
        ...sectionAnswers,
        [key]: value,
      },
    });
  };

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold tracking-tighthead text-ink">{group.title}</h2>
      <p className="mt-2 text-ink/60">
        Answer the questions below. You can upload process notes or photos where indicated.
      </p>

      <div className="mt-8 space-y-6">
        {group.questions.map((q) => {
          if (q.fileUpload) {
            const files = (sectionAnswers?.files as { id: string; name: string; type: string; base64: string; caption?: string; section: QuestionSection }[]) || [];
            return (
              <div key={String(q.key)}>
                <label className="block text-sm font-medium text-ink/80">
                  {q.label}
                </label>
                <FileUpload
                  section={group.id}
                  files={files}
                  onChange={(newFiles) =>
                    updateField("files", newFiles)
                  }
                />
              </div>
            );
          }

          const value = (sectionAnswers?.[q.key] as string) ?? "";
          const isTextarea = q.type === "textarea";

          return (
            <div key={String(q.key)}>
              <label htmlFor={String(q.key)} className="block text-sm font-medium text-ink/80">
                {q.label}
              </label>
              {isTextarea ? (
                <textarea
                  id={String(q.key)}
                  value={value}
                  onChange={(e) => updateField(q.key as string, e.target.value)}
                  placeholder={q.placeholder}
                  rows={4}
                  className={fieldClass}
                />
              ) : (
                <input
                  id={String(q.key)}
                  type="text"
                  value={value}
                  onChange={(e) => updateField(q.key as string, e.target.value)}
                  placeholder={q.placeholder}
                  className={fieldClass}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between">
        <button type="button" onClick={onBack} className="btn-secondary">
          Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary px-6 py-2">
          {isLast ? "Generate Case Study" : "Next"}
        </button>
      </div>
    </div>
  );
}
