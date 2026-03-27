"use client";

import { useMemo } from "react";

interface CaseStudyPreviewProps {
  content: string;
  isStreaming?: boolean;
}

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
const INSIGHTS_START = "<!--INSIGHTS_JSON_START-->";
const INSIGHTS_END = "<!--INSIGHTS_JSON_END-->";

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

function tryParseInsightsJson(jsonText: string): {
  insights: { text: string; sources: { fieldPath: string; snippet: string }[] }[];
} | null {
  try {
    const parsed = JSON.parse(jsonText) as {
      insights?: {
        text?: unknown;
        sources?: { fieldPath?: unknown; snippet?: unknown }[];
      }[];
    };

    if (!parsed?.insights || !Array.isArray(parsed.insights)) return null;

    // Minimal shape validation
    const insights = parsed.insights
      .filter((i) => typeof i?.text === "string")
      .map((i) => ({
        text: i.text as string,
        sources: Array.isArray(i.sources)
          ? i.sources
              .filter((s) => typeof s?.fieldPath === "string" && typeof s?.snippet === "string")
              .map((s) => ({ fieldPath: s.fieldPath as string, snippet: s.snippet as string }))
          : [],
      }));

    return { insights };
  } catch {
    return null;
  }
}

export function extractSynthesisMetadata(content: string): {
  markdownToRender: string;
  frameworkMeta: SynthesisFrameworkMeta;
  insightsJson: ReturnType<typeof tryParseInsightsJson>;
} {
  const frameworkStart = content.indexOf(FRAMEWORK_START);
  const frameworkEnd = content.indexOf(FRAMEWORK_END);
  const insightsStart = content.indexOf(INSIGHTS_START);
  const insightsEnd = content.indexOf(INSIGHTS_END);

  // If either JSON block is mid-stream, hide unfinished JSON from markdown render.
  if (
    (frameworkStart !== -1 && frameworkEnd === -1) ||
    (insightsStart !== -1 && insightsEnd === -1)
  ) {
    const firstMarker = [frameworkStart, insightsStart].filter((x) => x >= 0).sort((a, b) => a - b)[0];
    const markdown = firstMarker === undefined ? content : content.slice(0, firstMarker).trimEnd();
    return {
      markdownToRender: markdown,
      frameworkMeta: inferFrameworkMeta(),
      insightsJson: null,
    };
  }

  let markdown = content;
  let frameworkMeta = inferFrameworkMeta();
  let insightsJson: ReturnType<typeof tryParseInsightsJson> = null;

  if (frameworkStart !== -1 && frameworkEnd !== -1 && frameworkEnd > frameworkStart) {
    const frameworkText = content.slice(frameworkStart + FRAMEWORK_START.length, frameworkEnd).trim();
    frameworkMeta = tryParseFrameworkJson(frameworkText) ?? inferFrameworkMeta();
    markdown = markdown.replace(content.slice(frameworkStart, frameworkEnd + FRAMEWORK_END.length), "").trim();
  }

  if (insightsStart !== -1 && insightsEnd !== -1 && insightsEnd > insightsStart) {
    const insightsText = content.slice(insightsStart + INSIGHTS_START.length, insightsEnd).trim();
    insightsJson = tryParseInsightsJson(insightsText);
    markdown = markdown.replace(content.slice(insightsStart, insightsEnd + INSIGHTS_END.length), "").trim();
  }

  return {
    markdownToRender: markdown,
    frameworkMeta,
    insightsJson,
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

export function CaseStudyPreview({ content, isStreaming }: CaseStudyPreviewProps) {
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

  const { markdownToRender, insightsJson } = useMemo(() => extractSynthesisMetadata(content), [content]);

  const markdownWithoutInsights = useMemo(() => {
    // Only strip the markdown Insights section when we can re-render it with hoverable sources.
    if (!insightsJson) return markdownToRender.trim();
    return markdownToRender.replace(/^## Insights\s*[\s\S]*?(?=^## |\Z)/m, "").trim();
  }, [markdownToRender, insightsJson]);

  const insights = insightsJson?.insights ?? [];
  const hasMissingSources = insightsJson
    ? insights.some((ins) => !ins.sources || ins.sources.length === 0)
    : false;

  return (
    <div className="max-w-none text-ink/80">
      <div className="space-y-1">
        {renderMarkdown(markdownWithoutInsights)}
      </div>

      {insights.length > 0 && (
        <section className="mt-10">
          <h2 className="mt-0 border-b border-gray-100 pb-2 text-xl font-semibold text-ink">
            Insights
          </h2>
          {hasMissingSources && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Some insights are missing source references. Re-run generation or adjust inputs to ensure every insight is traceable.
            </div>
          )}
          <ul className="mt-3 space-y-3">
            {insights.map((ins, idx) => (
              <li
                key={`${idx}-${ins.text}`}
                className="group relative rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p className="text-sm font-medium text-ink/90">{ins.text}</p>
                {ins.sources.length > 0 && (
                  <div className="pointer-events-none absolute left-0 top-full z-10 hidden w-96 -translate-y-2 rounded-xl border border-gray-100 bg-white p-4 text-xs text-ink/80 shadow-lg group-hover:block">
                    <p className="font-medium text-ink/90">Sources</p>
                    <div className="mt-2 space-y-2">
                      {ins.sources.slice(0, 6).map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="font-medium text-ink/90">{s.fieldPath}</div>
                          <div className="text-ink/70">
                            {s.snippet}
                          </div>
                        </div>
                      ))}
                    </div>
                    {ins.sources.length > 6 && (
                      <p className="mt-2 text-ink/50">+{ins.sources.length - 6} more</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {isStreaming && (
        <span className="inline-block h-4 w-2 animate-pulse bg-primary/50" />
      )}
    </div>
  );
}
