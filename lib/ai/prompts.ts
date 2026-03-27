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
2) Write the portfolio case study in MARKDOWN with these sections (use markdown headers "## "):
   - Context & Problem
   - Process
   - Solution
   - Impact & Collaboration
   - Learnings
3) Also write an "## Insights" section that contains a bullet list of insight texts.

Framework fit heuristics:
- Prescriptive: clear causal chain from context/problem to intervention to outcomes.
- Hero: clear protagonist, challenge, trials/setbacks, resolution, and return/transfer of learning.
- FamiliarToForeign: starts in known context and transitions into new/less familiar behavior, context, or understanding.
- Framed: starts and ends in a similar state with changed understanding ("now-then-now", "here-there-here", or equivalent frame).
- Layered: sequence of compact images/snapshots that accumulate meaning over time.
- ContextualInterlude: strong sensory or contextual descriptions that deepen emotional meaning and interpretation.

Required beat names by framework:
- Prescriptive: ["GivenContext", "TriggerEvent", "Intervention", "Outcome"]
- Hero: ["CallToAction", "Trials", "Achievement", "ReturnWithLearning"]
- FamiliarToForeign: ["FamiliarStart", "Transition", "ForeignContext", "Resolution"]
- Framed: ["FrameOpen", "MiddleContrast", "FrameCloseChanged"]
- Layered: ["ImageSequence", "PatternEmerges", "InterpretiveTurn"]
- ContextualInterlude: ["ContextDetail", "InterludeMeaning", "NarrativeRejoin"]

Traceability rule for Insights:
- If traceability inputs are present (Evidence → Insights → Decisions), create ONE insight bullet for EACH user-provided item in traceAndExecution.insights[] (in the same order). You may polish wording, but the meaning must remain faithful to the user insight text.
- If traceability inputs are not present, you may create 3–5 insights, but each one must still have sources referencing user inputs.

IMPORTANT TRACEABILITY OUTPUT CONTRACT
At the end of your response, you MUST include these exact JSON blocks with exact markers:

<!--FRAMEWORK_JSON_START-->
{
  "selectedFramework": "Prescriptive|Hero|FamiliarToForeign|Framed|Layered|ContextualInterlude",
  "frameworkRationale": "short rationale tied to input signals",
  "plotBeats": [
    { "beat": "RequiredBeatName", "evidence": "short excerpt grounded in user input" }
  ]
}
<!--FRAMEWORK_JSON_END-->

<!--INSIGHTS_JSON_START-->
{
  "insights": [
    {
      "text": "...",
      "sources": [ { "fieldPath": "a.question.path", "snippet": "short excerpt" } ]
    }
  ]
}
<!--INSIGHTS_JSON_END-->

Hard rules:
- selectedFramework MUST be one of the six allowed framework names.
- plotBeats MUST include all required beats for the selected framework, using the exact beat names listed above.
- Every plotBeats entry MUST include non-empty "beat" and "evidence".
- frameworkRationale must be concise (max 2 sentences) and based only on supplied inputs.
- For every insight bullet in "## Insights", there MUST be a corresponding entry in the JSON "insights" array with the same or equivalent "text".
- Every JSON insight entry MUST have "sources" with length >= 1.
- Every source item MUST include both "fieldPath" and a non-empty "snippet".
- Sources must reference ONLY user-provided inputs (questionnaire fields or uploaded evidence filenames/text).
- Do not invent events, stakeholders, metrics, or outcomes that are not implied by provided inputs.
- Maintain plausibility: causal claims must be proportional to the evidence in the input.

Output formatting rules:
- The markdown case study should NOT include source details inline; sources are only in the JSON block.
- Output only the case study content in markdown plus the two JSON blocks. No explanations.`;
