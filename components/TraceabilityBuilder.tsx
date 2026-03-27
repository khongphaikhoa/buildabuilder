"use client";

import { useCallback } from "react";
import type { QuestionnaireAnswersV2, UploadFile } from "@/lib/questionnaire/schema";
import { FileUpload } from "./FileUpload";

type TraceAndExecution = QuestionnaireAnswersV2["traceAndExecution"];

type Insight = TraceAndExecution["insights"][number];
type Decision = TraceAndExecution["decisions"][number];

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function rebuildInsightToDecision(trace: TraceAndExecution): TraceAndExecution["insightToDecision"] {
  const insightIds = new Set(trace.insights.map((i) => i.id));
  const decisionIds = new Set(trace.decisions.map((d) => d.id));
  const pairs: { insightId: string; decisionId: string }[] = [];

  for (const decision of trace.decisions) {
    if (!decisionIds.has(decision.id)) continue;
    for (const insightId of decision.linkedInsightIds) {
      if (!insightIds.has(insightId)) continue;
      pairs.push({ insightId, decisionId: decision.id });
    }
  }

  // De-dupe in case the UI produces duplicates
  const seen = new Set<string>();
  return pairs.filter((p) => {
    const key = `${p.insightId}::${p.decisionId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function TraceabilityBuilder({
  value,
  onChange,
}: {
  value: TraceAndExecution;
  onChange: (next: TraceAndExecution) => void;
}) {
  const evidenceFiles = value.evidenceFiles;
  const insights = value.insights;
  const decisions = value.decisions;

  const update = useCallback(
    (next: TraceAndExecution) => {
      onChange({
        ...next,
        insightToDecision: rebuildInsightToDecision(next),
      });
    },
    [onChange]
  );

  const addInsight = () => {
    const id = crypto.randomUUID();
    update({
      ...value,
      insights: [
        ...value.insights,
        {
          id,
          text: "",
          evidenceFileIds: [],
        },
      ],
    });
  };

  const addDecision = () => {
    const id = crypto.randomUUID();
    update({
      ...value,
      decisions: [
        ...value.decisions,
        {
          id,
          text: "",
          execution: "",
          decisionRationale: "",
          linkedInsightIds: [],
        },
      ],
    });
  };

  return (
    <div className="space-y-10">
      <section>
        <h3 className="text-lg font-semibold text-ink">1) Evidence uploads</h3>
        <p className="mt-2 text-ink/60">
          Upload process notes and/or photos that support your insights and decisions. These are the “Evidence” inputs.
        </p>
        <div className="mt-6">
          <FileUpload
            section="traceAndExecution"
            files={evidenceFiles as UploadFile[]}
            onChange={(files) => update({ ...value, evidenceFiles: files })}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">2) Insights (what you learned)</h3>
          <button type="button" className="btn-primary" onClick={addInsight}>
            + Add insight
          </button>
        </div>

        {insights.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Add at least one insight so every decision has a trace.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {insights.map((insight, idx) => (
              <div key={insight.id} className="card-bento-row p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink/70">Insight {idx + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        ...value,
                        insights: value.insights.filter((i) => i.id !== insight.id),
                      })
                    }
                    className="rounded-lg px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <label className="mt-4 block text-sm font-medium text-ink/80">
                  Insight text
                </label>
                <textarea
                  value={insight.text}
                  onChange={(e) => {
                    const nextInsights = value.insights.map((i) =>
                      i.id === insight.id ? { ...i, text: e.target.value } : i
                    );
                    update({ ...value, insights: nextInsights });
                  }}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="mt-4">
                  <p className="text-sm font-medium text-ink/80">Link evidence to this insight</p>
                  {evidenceFiles.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/60">Upload evidence files to enable linking.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {evidenceFiles.map((file) => {
                        const checked = insight.evidenceFileIds.includes(file.id);
                        return (
                          <label
                            key={file.id}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextInsights = value.insights.map((i) => {
                                  if (i.id !== insight.id) return i;
                                  return {
                                    ...i,
                                    evidenceFileIds: toggleId(i.evidenceFileIds, file.id),
                                  };
                                });
                                update({ ...value, insights: nextInsights });
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm text-ink/80">{file.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">3) Decisions (what you executed)</h3>
          <button type="button" className="btn-primary" onClick={addDecision}>
            + Add decision
          </button>
        </div>

        {decisions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/60">Add at least one decision, then link it to insights.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {decisions.map((decision, idx) => (
              <div key={decision.id} className="card-bento-row p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink/70">Decision {idx + 1}</p>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        ...value,
                        decisions: value.decisions.filter((d) => d.id !== decision.id),
                      })
                    }
                    className="rounded-lg px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <label className="mt-4 block text-sm font-medium text-ink/80">Decision text</label>
                <input
                  value={decision.text}
                  onChange={(e) => {
                    const nextDecisions = value.decisions.map((d) =>
                      d.id === decision.id ? { ...d, text: e.target.value } : d
                    );
                    update({ ...value, decisions: nextDecisions });
                  }}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <label className="mt-4 block text-sm font-medium text-ink/80">Execution (what you did)</label>
                <textarea
                  value={decision.execution}
                  onChange={(e) => {
                    const nextDecisions = value.decisions.map((d) =>
                      d.id === decision.id ? { ...d, execution: e.target.value } : d
                    );
                    update({ ...value, decisions: nextDecisions });
                  }}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <label className="mt-4 block text-sm font-medium text-ink/80">Decision rationale (optional)</label>
                <textarea
                  value={decision.decisionRationale || ""}
                  onChange={(e) => {
                    const nextDecisions = value.decisions.map((d) =>
                      d.id === decision.id ? { ...d, decisionRationale: e.target.value } : d
                    );
                    update({ ...value, decisions: nextDecisions });
                  }}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-gray-100 bg-white px-4 py-3 text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <div className="mt-4">
                  <p className="text-sm font-medium text-ink/80">
                    Link this decision to the insights that drove it
                  </p>
                  {insights.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/60">Add insights first to enable linking.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {insights.map((ins) => {
                        const checked = decision.linkedInsightIds.includes(ins.id);
                        return (
                          <label
                            key={ins.id}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-100 bg-white p-3"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const nextDecisions = value.decisions.map((d) => {
                                  if (d.id !== decision.id) return d;
                                  return {
                                    ...d,
                                    linkedInsightIds: toggleId(d.linkedInsightIds, ins.id),
                                  };
                                });
                                update({ ...value, decisions: nextDecisions });
                              }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm text-ink/80">{ins.text || `Insight ${idx + 1}`}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

