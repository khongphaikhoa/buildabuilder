"use client";

import { FileUpload } from "./FileUpload";
import type { QuestionnaireAnswers, QuestionnaireAnswersV2, QuestionSection } from "@/lib/questionnaire/schema";
import { QUESTION_GROUPS } from "@/lib/questionnaire/schema";
import { TraceabilityBuilder } from "./TraceabilityBuilder";

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

  const fieldClass =
    "mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  if (group.id === "contextAndProblem") {
    const a = answers as any;
    const project = a.projectOverview ?? {};
    const problem = a.problemAndGoals ?? { files: [] };

    const updateProject = (key: string, value: string) => {
      onChange({
        ...answers,
        projectOverview: {
          ...project,
          [key]: value,
        },
      });
    };

    const updateProblem = (key: string, value: string | unknown[]) => {
      onChange({
        ...answers,
        problemAndGoals: {
          ...problem,
          [key]: value,
        },
      });
    };

    const files = (problem.files as any[]) || [];

    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tighthead text-ink">
          {group.title}
        </h2>
        <p className="mt-2 text-ink/60">
          Capture the context and the user problem you were solving.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Project name
            </label>
            <input
              value={project.projectName || ""}
              onChange={(e) => updateProject("projectName", e.target.value)}
              placeholder="e.g., Redesign checkout flow"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Client or context
            </label>
            <input
              value={project.clientContext || ""}
              onChange={(e) => updateProject("clientContext", e.target.value)}
              placeholder="e.g., E-commerce startup, 2024"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Timeline
            </label>
            <input
              value={project.timeline || ""}
              onChange={(e) => updateProject("timeline", e.target.value)}
              placeholder="e.g., 5 weeks, Jan–Feb 2024"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              What problem were you solving?
            </label>
            <textarea
              value={problem.problem || ""}
              onChange={(e) => updateProblem("problem", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Who were the target users?
            </label>
            <textarea
              value={problem.targetUsers || ""}
              onChange={(e) => updateProblem("targetUsers", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              What were the success criteria?
            </label>
            <textarea
              value={problem.successCriteria || ""}
              onChange={(e) => updateProblem("successCriteria", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Upload process notes or sketches
            </label>
            <FileUpload
              section="problemAndGoals"
              files={files}
              onChange={(newFiles) => updateProblem("files", newFiles)}
            />
          </div>
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

  // The traceability step has a custom UI and does not follow the generic key/value schema.
  if (group.id === "traceAndExecution") {
    const v2 = answers as QuestionnaireAnswersV2;
    const traceValue = v2.traceAndExecution;

    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tighthead text-ink">
          {group.title}
        </h2>
        <p className="mt-2 text-ink/60">
          Upload evidence, capture insights, then connect each decision to the insights that drove it.
        </p>

        <div className="mt-8">
          <TraceabilityBuilder
            value={traceValue}
            onChange={(nextTrace) => {
              onChange({
                ...(answers as QuestionnaireAnswers),
                traceAndExecution: nextTrace,
              });
            }}
          />
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

  if (group.id === "impactAndCollaboration") {
    const a = answers as any;
    const impact = a.impactAndLearnings ?? { files: [] };
    const role = a.roleAndCollaboration ?? {};

    const updateImpact = (key: string, value: string | unknown[]) => {
      onChange({
        ...answers,
        impactAndLearnings: {
          ...impact,
          [key]: value,
        },
      });
    };

    const updateRole = (key: string, value: string) => {
      onChange({
        ...answers,
        roleAndCollaboration: {
          ...role,
          [key]: value,
        },
      });
    };

    const files = (impact.files as any[]) || [];

    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tighthead text-ink">
          {group.title}
        </h2>
        <p className="mt-2 text-ink/60">
          Capture outcomes and your role so reviewers can understand impact and ownership.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink/80">
              What metrics or outcomes did you see?
            </label>
            <textarea
              value={impact.metrics || ""}
              onChange={(e) => updateImpact("metrics", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              What feedback did you receive?
            </label>
            <textarea
              value={impact.feedback || ""}
              onChange={(e) => updateImpact("feedback", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              What did you learn personally?
            </label>
            <textarea
              value={impact.personalLearnings || ""}
              onChange={(e) => updateImpact("personalLearnings", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Optional uploads
            </label>
            <FileUpload
              section="impactAndLearnings"
              files={files}
              onChange={(newFiles) => updateImpact("files", newFiles)}
            />
          </div>

          <div className="h-px bg-gray-100" />

          <div>
            <label className="block text-sm font-medium text-ink/80">
              What was your contribution?
            </label>
            <textarea
              value={role.contribution || ""}
              onChange={(e) => updateRole("contribution", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Team size
            </label>
            <input
              value={role.teamSize || ""}
              onChange={(e) => updateRole("teamSize", e.target.value)}
              placeholder="e.g., 3 designers, 2 devs"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/80">
              Who were the stakeholders?
            </label>
            <textarea
              value={role.stakeholders || ""}
              onChange={(e) => updateRole("stakeholders", e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
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

  const sectionAnswers = (answers as any)[group.id] as Record<string, unknown>;

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
