import { traceAndExecutionSchema } from "@/lib/questionnaire/schema";
import type { z } from "zod";

export type TraceAndExecution = z.infer<typeof traceAndExecutionSchema>;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function isImageEvidenceFile(f: { type: string }): boolean {
  return IMAGE_TYPES.includes(f.type);
}

/** Evidence file IDs tied to a decision via linked insights and explicit insight→decision links. */
export function getEvidenceIdsForDecision(
  trace: TraceAndExecution,
  decisionId: string
): string[] {
  const decision = trace.decisions.find((d) => d.id === decisionId);
  if (!decision) return [];

  const insightIds = new Set<string>();
  for (const id of decision.linkedInsightIds) {
    insightIds.add(id);
  }
  for (const link of trace.insightToDecision) {
    if (link.decisionId === decisionId) {
      insightIds.add(link.insightId);
    }
  }

  const evidenceIds = new Set<string>();
  for (const insightId of insightIds) {
    const insight = trace.insights.find((i) => i.id === insightId);
    if (insight) {
      for (const fid of insight.evidenceFileIds) {
        evidenceIds.add(fid);
      }
    }
  }
  return [...evidenceIds];
}

export function buildDecisionToEvidenceMap(trace: TraceAndExecution): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const d of trace.decisions) {
    map.set(d.id, getEvidenceIdsForDecision(trace, d.id));
  }
  return map;
}

/** Resolve questionnaire row id from AI output: explicit id wins, else same-index fallback. */
export function resolveQuestionnaireDecisionId(
  trace: TraceAndExecution,
  synthIndex: number,
  questionnaireDecisionId?: string
): string | null {
  if (
    questionnaireDecisionId &&
    trace.decisions.some((d) => d.id === questionnaireDecisionId)
  ) {
    return questionnaireDecisionId;
  }
  if (synthIndex >= 0 && synthIndex < trace.decisions.length) {
    return trace.decisions[synthIndex].id;
  }
  return null;
}

export function hasUsableImageData(f: { base64?: string }): boolean {
  const b = f.base64 ?? "";
  return b.length > 32;
}

export function getImageEvidenceFiles(trace: TraceAndExecution) {
  return trace.evidenceFiles.filter((f) => isImageEvidenceFile(f));
}

export function fileToDataUrl(f: { type: string; base64: string }): string {
  if (f.base64.startsWith("data:")) return f.base64;
  return `data:${f.type};base64,${f.base64}`;
}
