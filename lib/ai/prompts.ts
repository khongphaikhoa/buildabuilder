import type {
  QuestionnaireAnswers,
  QuestionnaireAnswersV2,
  UploadFile,
} from "@/lib/questionnaire/schema";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getTextFilesContent(files: UploadFile[], labelPrefix = "File"): string {
  const textFiles = files.filter((f) => !IMAGE_TYPES.includes(f.type));
  if (textFiles.length === 0) return "";

  return textFiles
    .map((f, idx) => {
      try {
        const payload = f.base64.includes(",") ? f.base64.split(",")[1] : f.base64;
        if (!payload) return `### ${labelPrefix} ${idx + 1}: ${f.name} (empty)`;
        const text = Buffer.from(payload, "base64").toString("utf-8");
        // Truncate to keep prompt size manageable
        const snippet = text.length > 1500 ? `${text.slice(0, 1500)}...` : text;
        return `### ${labelPrefix} ${idx + 1}: ${f.name}\n${snippet}`;
      } catch {
        return `### ${labelPrefix} ${idx + 1}: ${f.name} (could not read file)`;
      }
    })
    .join("\n\n");
}

function buildV1Prompt(answers: QuestionnaireAnswers): string {
  const sections: string[] = [];

  sections.push(
    `## Context & Problem\n- Project name: ${answers.projectOverview.projectName}\n- Client/context: ${answers.projectOverview.clientContext}\n- Timeline: ${answers.projectOverview.timeline}\n- Problem: ${answers.problemAndGoals.problem}\n- Target users: ${answers.problemAndGoals.targetUsers}\n- Success criteria: ${answers.problemAndGoals.successCriteria}`
  );

  sections.push(
    `## Process\n- Research: ${(answers as any).process?.research}\n- Ideation: ${(answers as any).process?.ideation}\n- Iteration: ${(answers as any).process?.iteration}\n- Key decisions: ${(answers as any).process?.keyDecisions}`
  );

  sections.push(
    `## Solution\n- Final design: ${(answers as any).solution?.finalDesign}\n- Rationale: ${(answers as any).solution?.rationale}\n- Tradeoffs: ${(answers as any).solution?.tradeoffs}`
  );

  sections.push(
    `## Impact & Collaboration\n- Metrics: ${answers.impactAndLearnings.metrics}\n- Feedback: ${answers.impactAndLearnings.feedback}\n- Personal learnings: ${answers.impactAndLearnings.personalLearnings}\n- Contribution: ${answers.roleAndCollaboration.contribution}\n- Team size: ${answers.roleAndCollaboration.teamSize}\n- Stakeholders: ${answers.roleAndCollaboration.stakeholders}`
  );

  const v1 = answers as any;
  const uploadedNotes =
    getTextFilesContent(v1.problemAndGoals?.files || [], "Goal note") +
    getTextFilesContent(v1.process?.files || [], "Process evidence") +
    getTextFilesContent(v1.solution?.files || [], "Solution evidence") +
    getTextFilesContent(v1.impactAndLearnings?.files || [], "Impact evidence");

  if (uploadedNotes.trim()) {
    sections.push(`## Uploaded Evidence (text)\n${uploadedNotes}`);
  }

  return sections.join("\n\n");
}

function buildV2Prompt(answers: QuestionnaireAnswersV2): string {
  const trace = answers.traceAndExecution;

  const project = answers.projectOverview;
  const problem = answers.problemAndGoals;
  const impact = answers.impactAndLearnings;
  const role = answers.roleAndCollaboration;

  const evidenceText = getTextFilesContent(trace.evidenceFiles || [], "Evidence");
  const hasEvidenceText = evidenceText.trim().length > 0;

  const evidenceCatalog = [
    `Evidence file count: ${trace.evidenceFiles.length}`,
    trace.evidenceFiles.length === 0
      ? "No evidence uploaded."
      : trace.evidenceFiles
          .slice(0, 25)
          .map((f) => `- ${f.name} (id=${f.id}, type=${f.type})`)
          .join("\n"),
  ].join("\n");

  const insightsBlock =
    trace.insights.length === 0
      ? "No insights provided."
      : trace.insights
          .map((ins, i) => {
            const evidenceNames = ins.evidenceFileIds
              .map((eid) => trace.evidenceFiles.find((f) => f.id === eid)?.name)
              .filter(Boolean)
              .slice(0, 10) as string[];
            return `Insight ${i + 1} (id=${ins.id})\n- Text: ${ins.text}\n- EvidenceFileIds: ${ins.evidenceFileIds.join(", ")}${
              evidenceNames.length ? `\n- Evidence names: ${evidenceNames.join(", ")}` : ""
            }`;
          })
          .join("\n\n");

  const decisionsBlock =
    trace.decisions.length === 0
      ? "No decisions provided."
      : trace.decisions
          .map((dec, i) => {
            return `Decision ${i + 1} (id=${dec.id})\n- Decision text: ${dec.text}\n- Execution: ${dec.execution}\n- Decision rationale: ${dec.decisionRationale || ""}\n- LinkedInsightIds: ${dec.linkedInsightIds.join(", ")}`;
          })
          .join("\n\n");

  const mappingBlock =
    trace.insightToDecision.length === 0
      ? "No insight-to-decision mapping provided."
      : trace.insightToDecision
          .slice(0, 100)
          .map((p) => `- insightId=${p.insightId} -> decisionId=${p.decisionId}`)
          .join("\n");

  const otherUploadedNotes =
    getTextFilesContent(answers.problemAndGoals.files, "Goal note") +
    getTextFilesContent(answers.impactAndLearnings.files, "Impact evidence");

  const otherNotesBlock = otherUploadedNotes.trim()
    ? `## Uploaded Evidence (other text)\n${otherUploadedNotes}`
    : "";

  const sections: string[] = [];
  sections.push(
    `## Context & Problem\n- Project name: ${project.projectName}\n- Client/context: ${project.clientContext}\n- Timeline: ${project.timeline}\n- Problem: ${problem.problem}\n- Target users: ${problem.targetUsers}\n- Success criteria: ${problem.successCriteria}`
  );
  sections.push(`## Traceability Input (Evidence → Insights → Decisions)\n${evidenceCatalog}`);

  if (hasEvidenceText) {
    sections.push(`## Evidence text content\n${evidenceText}`);
  }

  sections.push(`## Insights (user-provided)\n${insightsBlock}`);
  sections.push(`## Decisions (user-provided)\n${decisionsBlock}`);
  sections.push(`## Insight-to-Decision mapping (explicit)\n${mappingBlock}`);

  if (otherNotesBlock) sections.push(otherNotesBlock);

  sections.push(
    `## Impact & Collaboration\n- Metrics: ${impact.metrics}\n- Feedback: ${impact.feedback}\n- Personal learnings: ${impact.personalLearnings}\n- Contribution: ${role.contribution}\n- Team size: ${role.teamSize}\n- Stakeholders: ${role.stakeholders}`
  );

  return sections.join("\n\n");
}

export function buildUserPrompt(answers: QuestionnaireAnswers): string {
  if ("traceAndExecution" in answers) {
    return buildV2Prompt(answers);
  }
  return buildV1Prompt(answers);
}

export function getImageFiles(answers: QuestionnaireAnswers): UploadFile[] {
  const allFiles: UploadFile[] = [];

  allFiles.push(...answers.problemAndGoals.files);
  allFiles.push(...answers.impactAndLearnings.files);

  if ("traceAndExecution" in answers) {
    allFiles.push(...answers.traceAndExecution.evidenceFiles);
  } else {
    allFiles.push(...(answers as any).process.files);
    allFiles.push(...(answers as any).solution.files);
  }

  return allFiles.filter((f) => IMAGE_TYPES.includes(f.type));
}

export const STORY_FRAMEWORKS = [
  "Prescriptive",
  "Hero",
  "FamiliarToForeign",
  "Framed",
  "Layered",
  "ContextualInterlude",
] as const;

export const SYSTEM_PROMPT = `You are an expert UX portfolio writer.

You will be given raw UX project inputs (text answers and uploaded evidence files) and possibly an explicit traceability structure (Evidence → Insights → Decisions).

Task:
1) First, select exactly ONE storytelling framework from this set:
   - Prescriptive
   - Hero
   - FamiliarToForeign
   - Framed
   - Layered
   - ContextualInterlude
2) Then write ONE cohesive portfolio case study narrative in MARKDOWN that is structured by the chosen framework's plot logic (not by generic section headings like "Context", "Process", "Solution", etc.).
3) Keep the narrative concise for reuse in an existing portfolio:
   - Target 180-320 words total for the main narrative.
   - Absolute max 380 words for the main narrative.
4) Include a very short framework-fit explanation (2-4 bullet points max) as "## Why this framework fits", grounded in provided evidence only.

Framework fit heuristics (from UX storytelling structure + plot principles):
- Prescriptive:
  - Best when inputs are strongest as a logical argument with clear causality.
  - Prefer when facts are explicit and linear: Given context -> Event/constraint -> Response -> Outcome.
  - Emphasize plausibility with small justified steps; avoid big unsupported leaps.
- Hero:
  - Best when there is a central actor (user, team, or designer) facing meaningful obstacles.
  - Should show journey arc: call to action, resistance/trials, breakthrough, and return with changed capability/understanding.
  - Works well when setbacks and recovery are concrete in the input.
- FamiliarToForeign:
  - Best when story must lead audience from accepted reality into a less familiar concept/design.
  - Start with recognizable context and gradually bridge to the new model via parallels and transition moments.
  - Use when adoption or conceptual shift is core to the case.
- Framed:
  - Best when beginning and ending states mirror each other but meaning changes (Now-Then-Now, Here-There-Here, Me-Them-Me).
  - Use to highlight contrast over time while preserving continuity.
  - Ending should echo opening language with a clear shift in understanding or capability.
- Layered:
  - Best when evidence comes as multiple concrete snapshots that accumulate into meaning.
  - Build with concise image-like moments; pattern emerges late rather than explained upfront.
  - Use when emotional or experiential texture matters as much as procedural sequence.
- ContextualInterlude:
  - Best when sensory/contextual detail is crucial for audience empathy or interpretation.
  - Interludes should temporarily pause forward action, add texture, then rejoin the main narrative.
  - Use sparingly and purposefully to support the core plot rather than replace it.

Plot and structure quality checks:
- Coverage: include all major facts and constraints from user inputs.
- Coherence: sequence is understandable even if not purely chronological.
- Plausibility: every major claim feels believable at that point in the story.
- Fit: chosen framework matches the actual evidence pattern, not forced.
- Audience imagination: enough concrete detail to trust, enough openness to engage.

Required beat names by framework:
- Prescriptive: ["GivenContext", "TriggerEvent", "Intervention", "Outcome"]
- Hero: ["CallToAction", "Trials", "Achievement", "ReturnWithLearning"]
- FamiliarToForeign: ["FamiliarStart", "Transition", "ForeignContext", "Resolution"]
- Framed: ["FrameOpen", "MiddleContrast", "FrameCloseChanged"]
- Layered: ["ImageSequence", "PatternEmerges", "InterpretiveTurn"]
- ContextualInterlude: ["ContextDetail", "InterludeMeaning", "NarrativeRejoin"]

Traceability rule for Decisions:
- If traceability inputs are present (Evidence → Insights → Decisions), create ONE decision JSON entry for EACH user-provided item in traceAndExecution.decisions[] (in the same order). You may polish wording, but meaning must remain faithful.
- When traceability is present, every decision JSON entry MUST include "questionnaireDecisionId" matching the corresponding traceAndExecution.decisions[].id (this id is used to align UI with evidence images).
- If traceability inputs are not present, create 2-4 decision entries inferred from the case, each grounded in user-provided inputs (omit questionnaireDecisionId or use empty string).

IMPORTANT TRACEABILITY OUTPUT CONTRACT
At the end of your response, you MUST include these exact JSON blocks with exact markers:

<!--FRAMEWORK_JSON_START-->
{
  "selectedFramework": "Prescriptive|Hero|FamiliarToForeign|Framed|Layered|ContextualInterlude",
  "frameworkRationale": "short rationale tied to input signals",
  "fitSignals": ["2-4 short bullets explaining why this framework matches the inputs"],
  "plotBeats": [
    { "beat": "RequiredBeatName", "evidence": "short excerpt grounded in user input" }
  ]
}
<!--FRAMEWORK_JSON_END-->

<!--DECISIONS_JSON_START-->
{
  "decisions": [
    {
      "questionnaireDecisionId": "same id as traceAndExecution.decisions[].id when traceability is present",
      "decisionText": "short decision title",
      "decisionDetails": "1-2 sentence explanation of what was done",
      "rationaleInsight": "the key insight that explains why this decision was made",
      "sources": [ { "fieldPath": "a.question.path", "snippet": "short excerpt" } ]
    }
  ]
}
<!--DECISIONS_JSON_END-->

Hard rules:
- selectedFramework MUST be one of the six allowed framework names.
- The main case study body must be a single cohesive narrative organized by the selected framework's beats, not a generic section-by-section report.
- The main case study body must stay within the length limits above.
- plotBeats MUST include all required beats for the selected framework, using the exact beat names listed above.
- Every plotBeats entry MUST include non-empty "beat" and "evidence".
- frameworkRationale must be concise (max 2 sentences) and based only on supplied inputs.
- fitSignals must include 2-4 concise bullets and each must map to concrete input evidence.
- Every decision JSON entry MUST include non-empty "decisionText", "decisionDetails", and "rationaleInsight".
- When traceability inputs exist, every decision JSON entry MUST include a non-empty "questionnaireDecisionId" that matches an id in traceAndExecution.decisions[].
- Every decision JSON entry MUST have "sources" with length >= 1.
- Every source item MUST include both "fieldPath" and a non-empty "snippet".
- Sources must reference ONLY user-provided inputs (questionnaire fields or uploaded evidence filenames/text).
- Do not invent events, stakeholders, metrics, or outcomes that are not implied by provided inputs.
- Maintain plausibility: causal claims must be proportional to the evidence in the input.

Output formatting rules:
- The markdown case study should NOT include source details inline; sources are only in the JSON block.
- Do NOT add a standalone "## Insights" section in markdown; insights should live in decisions JSON as rationaleInsight.
- Do not use the fixed headings "## Context & Problem", "## Process", "## Solution", "## Impact & Collaboration", or "## Learnings" for the main narrative.
- Output only the case study content in markdown plus the two JSON blocks. No explanations.`;
