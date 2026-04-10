"use client";

import { useMemo } from "react";
import type { TraceAndExecution } from "@/lib/questionnaire/traceability";
import {
  fileToDataUrl,
  getEvidenceIdsForDecision,
  getImageEvidenceFiles,
  hasUsableImageData,
  resolveQuestionnaireDecisionId,
} from "@/lib/questionnaire/traceability";

interface CaseStudyPreviewProps {
  content: string;
  isStreaming?: boolean;
  /** When set (v2), decision cards can be grouped under linked evidence images. */
  traceAndExecution?: TraceAndExecution | null;
  /**
   * When false, do not group by images (e.g. shared link without image bytes).
   * Defaults to true.
   */
  allowEvidenceImageGrouping?: boolean;
}

export type ParsedDecisionItem = {
  questionnaireDecisionId?: string;
  decisionText: string;
  decisionDetails: string;
  rationaleInsight: string;
  sources: { fieldPath: string; snippet: string }[];
};

export type StoryFramework =
  | "Prescriptive"
  | "Hero"
  | "FamiliarToForeign"
  | "Framed"
  | "Layered"
  | "ContextualInterlude";

export interface SynthesisFrameworkMeta {
  selectedFramework: StoryFramework;
  frameworkRationale: string;
  plotBeats: { beat: string; evidence: string }[];
  isInferred?: boolean;
}

const FRAMEWORKS: StoryFramework[] = [
  "Prescriptive",
  "Hero",
  "FamiliarToForeign",
  "Framed",
  "Layered",
  "ContextualInterlude",
];
const FRAMEWORK_START = "<!--FRAMEWORK_JSON_START-->";
const FRAMEWORK_END = "<!--FRAMEWORK_JSON_END-->";
const DECISIONS_START = "<!--DECISIONS_JSON_START-->";
const DECISIONS_END = "<!--DECISIONS_JSON_END-->";

function inferFrameworkMeta(): SynthesisFrameworkMeta {
  return {
    selectedFramework: "Prescriptive",
    frameworkRationale: "Inferred fallback because framework metadata was missing or invalid.",
    plotBeats: [],
    isInferred: true,
  };
}

function tryParseFrameworkJson(jsonText: string): SynthesisFrameworkMeta | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      selectedFramework?: unknown;
      frameworkRationale?: unknown;
      plotBeats?: { beat?: unknown; evidence?: unknown }[];
    };

    if (!FRAMEWORKS.includes(parsed.selectedFramework as StoryFramework)) return null;
    if (typeof parsed.frameworkRationale !== "string" || !parsed.frameworkRationale.trim()) return null;
    if (!Array.isArray(parsed.plotBeats)) return null;

    const plotBeats = parsed.plotBeats
      .filter((p) => typeof p?.beat === "string" && typeof p?.evidence === "string")
      .map((p) => ({ beat: p.beat as string, evidence: p.evidence as string }));

    return {
      selectedFramework: parsed.selectedFramework as StoryFramework,
      frameworkRationale: parsed.frameworkRationale.trim(),
      plotBeats,
    };
  } catch {
    return null;
  }
}

function tryParseDecisionsJson(jsonText: string): {
  decisions: ParsedDecisionItem[];
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      decisions?: {
        questionnaireDecisionId?: unknown;
        decisionText?: unknown;
        decisionDetails?: unknown;
        rationaleInsight?: unknown;
        sources?: { fieldPath?: unknown; snippet?: unknown }[];
      }[];
    };

    if (!parsed?.decisions || !Array.isArray(parsed.decisions)) return null;

    // Minimal shape validation
    const decisions = parsed.decisions
      .filter(
        (d) =>
          typeof d?.decisionText === "string" &&
          typeof d?.decisionDetails === "string" &&
          typeof d?.rationaleInsight === "string"
      )
      .map((d) => ({
        questionnaireDecisionId:
          typeof d.questionnaireDecisionId === "string" && d.questionnaireDecisionId.trim()
            ? (d.questionnaireDecisionId as string).trim()
            : undefined,
        decisionText: d.decisionText as string,
        decisionDetails: d.decisionDetails as string,
        rationaleInsight: d.rationaleInsight as string,
        sources: Array.isArray(d.sources)
          ? d.sources
              .filter((s) => typeof s?.fieldPath === "string" && typeof s?.snippet === "string")
              .map((s) => ({ fieldPath: s.fieldPath as string, snippet: s.snippet as string }))
          : [],
      }));

    return { decisions };
  } catch {
    return null;
  }
}

export function extractSynthesisMetadata(content: string): {
  markdownToRender: string;
  frameworkMeta: SynthesisFrameworkMeta;
  decisionsJson: ReturnType<typeof tryParseDecisionsJson>;
} {
  const frameworkStart = content.indexOf(FRAMEWORK_START);
  const frameworkEnd = content.indexOf(FRAMEWORK_END);
  const decisionsStart = content.indexOf(DECISIONS_START);
  const decisionsEnd = content.indexOf(DECISIONS_END);

  // If either JSON block is mid-stream, hide unfinished JSON from markdown render.
  if (
    (frameworkStart !== -1 && frameworkEnd === -1) ||
    (decisionsStart !== -1 && decisionsEnd === -1)
  ) {
    const firstMarker = [frameworkStart, decisionsStart].filter((x) => x >= 0).sort((a, b) => a - b)[0];
    const markdown = firstMarker === undefined ? content : content.slice(0, firstMarker).trimEnd();
    return {
      markdownToRender: markdown,
      frameworkMeta: inferFrameworkMeta(),
      decisionsJson: null,
    };
  }

  let markdown = content;
  let frameworkMeta = inferFrameworkMeta();
  let decisionsJson: ReturnType<typeof tryParseDecisionsJson> = null;

  if (frameworkStart !== -1 && frameworkEnd !== -1 && frameworkEnd > frameworkStart) {
    const frameworkText = content.slice(frameworkStart + FRAMEWORK_START.length, frameworkEnd).trim();
    frameworkMeta = tryParseFrameworkJson(frameworkText) ?? inferFrameworkMeta();
    markdown = markdown.replace(content.slice(frameworkStart, frameworkEnd + FRAMEWORK_END.length), "").trim();
  }

  if (decisionsStart !== -1 && decisionsEnd !== -1 && decisionsEnd > decisionsStart) {
    const decisionsText = content.slice(decisionsStart + DECISIONS_START.length, decisionsEnd).trim();
    decisionsJson = tryParseDecisionsJson(decisionsText);
    markdown = markdown.replace(content.slice(decisionsStart, decisionsEnd + DECISIONS_END.length), "").trim();
  }

  return {
    markdownToRender: markdown,
    frameworkMeta,
    decisionsJson,
  };
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="my-2 list-disc pl-6">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="mt-8 border-b border-gray-100 pb-2 text-xl font-semibold text-ink">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="mt-6 text-lg font-semibold text-ink">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.trim()) {
      flushList();
      const parts = line.split(/(\*\*.+?\*\*)/g);
      elements.push(
        <p key={key++} className="my-4 text-ink/80">
          {parts.map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    } else {
      flushList();
      elements.push(<div key={key++} className="h-2" />);
    }
  }
  flushList();
  return elements;
}

type ResolvedDecisionRow = ParsedDecisionItem & {
  resolvedDecisionId: string | null;
  evidenceIds: string[];
};

function DecisionCard({
  dec,
  idxKey,
}: {
  dec: ParsedDecisionItem;
  idxKey: string;
}) {
  return (
    <li
      key={idxKey}
      className="group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <p className="text-sm font-semibold text-ink/95">{dec.decisionText}</p>
      <p className="mt-1 text-sm text-ink/75">{dec.decisionDetails}</p>
      {(dec.rationaleInsight || dec.sources.length > 0) && (
        <div className="pointer-events-none absolute left-0 top-full z-10 hidden w-96 -translate-y-2 rounded-xl border border-gray-100 bg-white p-4 text-xs text-ink/80 shadow-lg group-hover:block">
          {dec.rationaleInsight && (
            <>
              <p className="font-medium text-ink/90">Insight (Rationale)</p>
              <p className="mt-2 text-ink/75">{dec.rationaleInsight}</p>
            </>
          )}
          {dec.sources.length > 0 && (
            <>
              <p className="mt-3 font-medium text-ink/90">Sources</p>
              <div className="mt-2 space-y-2">
                {dec.sources.slice(0, 6).map((s, i) => (
                  <div key={i} className="space-y-1">
                    <div className="font-medium text-ink/90">{s.fieldPath}</div>
                    <div className="text-ink/70">{s.snippet}</div>
                  </div>
                ))}
              </div>
              {dec.sources.length > 6 && (
                <p className="mt-2 text-ink/50">+{dec.sources.length - 6} more</p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

export function CaseStudyPreview({
  content,
  isStreaming,
  traceAndExecution,
  allowEvidenceImageGrouping = true,
}: CaseStudyPreviewProps) {
  if (!content) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-100 border-t-primary" />
          <p className="text-sm text-ink/60">Generating your case study...</p>
        </div>
      </div>
    );
  }

  const { markdownToRender, decisionsJson } = useMemo(() => extractSynthesisMetadata(content), [content]);

  const markdownWithoutInsights = useMemo(() => {
    // Strip any markdown Insights section so analysis is not duplicated.
    return markdownToRender.replace(/^## Insights\s*[\s\S]*?(?=^## |\Z)/m, "").trim();
  }, [markdownToRender]);

  const decisions = decisionsJson?.decisions ?? [];
  const hasMissingSources = decisionsJson
    ? decisions.some((dec) => !dec.sources || dec.sources.length === 0)
    : false;

  const resolvedRows: ResolvedDecisionRow[] = useMemo(() => {
    if (!traceAndExecution) {
      return decisions.map((d) => ({
        ...d,
        resolvedDecisionId: null as string | null,
        evidenceIds: [] as string[],
      }));
    }
    return decisions.map((d, idx) => {
      const resolvedDecisionId = resolveQuestionnaireDecisionId(
        traceAndExecution,
        idx,
        d.questionnaireDecisionId
      );
      const evidenceIds = resolvedDecisionId
        ? getEvidenceIdsForDecision(traceAndExecution, resolvedDecisionId)
        : [];
      return { ...d, resolvedDecisionId, evidenceIds };
    });
  }, [decisions, traceAndExecution]);

  const imageFiles = traceAndExecution ? getImageEvidenceFiles(traceAndExecution) : [];
  const canRenderImageBytes = imageFiles.some((f) => hasUsableImageData(f));
  const useGroupedLayout =
    allowEvidenceImageGrouping &&
    !!traceAndExecution &&
    imageFiles.length > 0 &&
    canRenderImageBytes;

  const showGroupingUnavailableNote =
    allowEvidenceImageGrouping &&
    !!traceAndExecution &&
    imageFiles.length > 0 &&
    !canRenderImageBytes;

  return (
    <div className="max-w-none pb-28 text-ink/80">
      <div className="space-y-1">
        {renderMarkdown(markdownWithoutInsights)}
      </div>

      {decisions.length > 0 && (
        <section className="mt-10 pb-20">
          <h2 className="mt-0 border-b border-gray-100 pb-2 text-xl font-semibold text-ink">
            Decisions
          </h2>
          {showGroupingUnavailableNote && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Linked evidence images are not available in this view (for example on a shared link without image data). Open the project on the device where you created it to see decisions grouped under images.
            </div>
          )}
          {hasMissingSources && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Some decisions are missing source references. Re-run generation or adjust inputs to ensure every decision is traceable.
            </div>
          )}
          {useGroupedLayout && traceAndExecution ? (
            <div className="mt-6 space-y-10">
              {imageFiles
                .filter((f) => hasUsableImageData(f))
                .map((file) => {
                  const underImage = resolvedRows.filter((row) =>
                    row.evidenceIds.includes(file.id)
                  );
                  return (
                    <div key={file.id} className="space-y-3">
                      <figure className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                        <img
                          src={fileToDataUrl(file)}
                          alt={file.caption || file.name || "Evidence"}
                          className="max-h-[min(420px,70vh)] w-full object-contain"
                        />
                        {(file.caption || file.name) && (
                          <figcaption className="border-t border-gray-100 px-3 py-2 text-xs text-ink/60">
                            {file.caption || file.name}
                          </figcaption>
                        )}
                      </figure>
                      {underImage.length > 0 ? (
                        <ul className="space-y-3">
                          {underImage.map((dec, idx) => (
                            <DecisionCard
                              key={`${file.id}-${dec.resolvedDecisionId ?? idx}-${dec.decisionText}`}
                              idxKey={`${file.id}-${idx}`}
                              dec={dec}
                            />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-ink/50">No decisions linked to this evidence.</p>
                      )}
                    </div>
                  );
                })}

              {resolvedRows.some((r) => r.evidenceIds.length === 0) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-ink/80">Other decisions</h3>
                  <p className="text-xs text-ink/50">
                    Not tied to a specific image in the traceability graph.
                  </p>
                  <ul className="space-y-3">
                    {resolvedRows
                      .filter((r) => r.evidenceIds.length === 0)
                      .map((dec, idx) => (
                        <DecisionCard
                          key={`unlinked-${idx}-${dec.decisionText}`}
                          idxKey={`unlinked-${idx}`}
                          dec={dec}
                        />
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <ul className="mt-3 space-y-3">
              {resolvedRows.map((dec, idx) => (
                <DecisionCard
                  key={`${idx}-${dec.decisionText}-${dec.resolvedDecisionId ?? "x"}`}
                  idxKey={`flat-${idx}`}
                  dec={dec}
                />
              ))}
            </ul>
          )}
        </section>
      )}
      {isStreaming && (
        <span className="inline-block h-4 w-2 animate-pulse bg-primary/50" />
      )}
    </div>
  );
}
