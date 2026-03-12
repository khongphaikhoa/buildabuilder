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

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-semibold text-stone-900">{group.title}</h2>
      <p className="mt-2 text-stone-600">
        Answer the questions below. You can upload process notes or photos where indicated.
      </p>

      <div className="mt-8 space-y-6">
        {group.questions.map((q) => {
          if (q.fileUpload) {
            const files = (sectionAnswers?.files as { id: string; name: string; type: string; base64: string; caption?: string; section: QuestionSection }[]) || [];
            return (
              <div key={String(q.key)}>
                <label className="block text-sm font-medium text-stone-700">
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
              <label htmlFor={String(q.key)} className="block text-sm font-medium text-stone-700">
                {q.label}
              </label>
              {isTextarea ? (
                <textarea
                  id={String(q.key)}
                  value={value}
                  onChange={(e) => updateField(q.key as string, e.target.value)}
                  placeholder={q.placeholder}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              ) : (
                <input
                  id={String(q.key)}
                  type="text"
                  value={value}
                  onChange={(e) => updateField(q.key as string, e.target.value)}
                  placeholder={q.placeholder}
                  className="mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          {isLast ? "Generate Case Study" : "Next"}
        </button>
      </div>
    </div>
  );
}
