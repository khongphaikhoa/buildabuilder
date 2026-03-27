import type { QuestionnaireAnswersV1, QuestionnaireAnswersV2 } from "@/lib/questionnaire/schema";

function makeId(prefix: string): string {
  // Deterministic IDs aren't required; they're only for internal traceability linking.
  // Using a short prefix keeps them readable when debugging.
  try {
    // Browser/modern runtimes
    return `${prefix}_${globalThis.crypto.randomUUID().slice(0, 8)}`;
  } catch {
    // Node fallback (shouldn't usually happen in Next.js client code)
    return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
  }
}

export function normalizeAnswersToV2(
  answers: QuestionnaireAnswersV1 | QuestionnaireAnswersV2
): QuestionnaireAnswersV2 {
  if ("traceAndExecution" in answers) return answers;

  const evidenceFiles = [...answers.process.files, ...answers.solution.files];
  const insightId = makeId("insight");
  const decisionId = makeId("decision");

  const mergedInsightText = [
    answers.process.research ? `Research: ${answers.process.research}` : "",
    answers.process.ideation ? `Ideation: ${answers.process.ideation}` : "",
    answers.process.iteration ? `Iteration: ${answers.process.iteration}` : "",
    answers.process.keyDecisions
      ? `Key decisions: ${answers.process.keyDecisions}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const mergedDecisionText = answers.solution.finalDesign || "";

  const mergedExecutionText = [
    answers.solution.rationale ? `Rationale: ${answers.solution.rationale}` : "",
    answers.solution.tradeoffs ? `Tradeoffs: ${answers.solution.tradeoffs}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    projectOverview: answers.projectOverview,
    problemAndGoals: answers.problemAndGoals,
    traceAndExecution: {
      evidenceFiles,
      insights: [
        {
          id: insightId,
          text: mergedInsightText,
          evidenceFileIds: evidenceFiles.map((f) => f.id),
        },
      ],
      decisions: [
        {
          id: decisionId,
          text: mergedDecisionText,
          execution: mergedExecutionText,
          decisionRationale: "",
          linkedInsightIds: [insightId],
        },
      ],
      insightToDecision: [{ insightId, decisionId }],
    },
    impactAndLearnings: answers.impactAndLearnings,
    roleAndCollaboration: answers.roleAndCollaboration,
  };
}

