import type { QuestionnaireAnswers, UploadFile } from "@/lib/questionnaire/schema";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatAnswersForPrompt(answers: QuestionnaireAnswers): string {
  const sections: string[] = [];

  sections.push(`## Project Overview\n- Project name: ${answers.projectOverview.projectName}\n- Client/context: ${answers.projectOverview.clientContext}\n- Timeline: ${answers.projectOverview.timeline}`);

  sections.push(`## Problem & Goals\n- Problem: ${answers.problemAndGoals.problem}\n- Target users: ${answers.problemAndGoals.targetUsers}\n- Success criteria: ${answers.problemAndGoals.successCriteria}`);

  sections.push(`## Process\n- Research: ${answers.process.research}\n- Ideation: ${answers.process.ideation}\n- Iteration: ${answers.process.iteration}\n- Key decisions: ${answers.process.keyDecisions}`);

  sections.push(`## Solution\n- Final design: ${answers.solution.finalDesign}\n- Rationale: ${answers.solution.rationale}\n- Tradeoffs: ${answers.solution.tradeoffs}`);

  sections.push(`## Impact & Learnings\n- Metrics: ${answers.impactAndLearnings.metrics}\n- Feedback: ${answers.impactAndLearnings.feedback}\n- Personal learnings: ${answers.impactAndLearnings.personalLearnings}`);

  sections.push(`## Role & Collaboration\n- Contribution: ${answers.roleAndCollaboration.contribution}\n- Team size: ${answers.roleAndCollaboration.teamSize}\n- Stakeholders: ${answers.roleAndCollaboration.stakeholders}`);

  return sections.join("\n\n");
}

function getTextFilesContent(files: UploadFile[]): string {
  const textFiles = files.filter((f) => !IMAGE_TYPES.includes(f.type));
  if (textFiles.length === 0) return "";
  return textFiles
    .map((f) => {
      try {
        const payload = f.base64.includes(",") ? f.base64.split(",")[1] : f.base64;
        if (!payload) return `### ${f.name}: (empty)`;
        const text = Buffer.from(payload, "base64").toString("utf-8");
        return `### ${f.name}${f.caption ? ` (${f.caption})` : ""}\n${text}`;
      } catch {
        return `### ${f.name}: (could not read file)`;
      }
    })
    .join("\n\n");
}

export function buildUserPrompt(answers: QuestionnaireAnswers): string {
  const textContent = formatAnswersForPrompt(answers);
  const processNotes =
    getTextFilesContent(answers.problemAndGoals.files) +
    getTextFilesContent(answers.process.files) +
    getTextFilesContent(answers.solution.files) +
    getTextFilesContent(answers.impactAndLearnings.files);

  if (processNotes.trim()) {
    return `${textContent}\n\n## Uploaded Process Notes\n${processNotes}`;
  }
  return textContent;
}

export function getImageFiles(answers: QuestionnaireAnswers): UploadFile[] {
  const allFiles: UploadFile[] = [
    ...answers.problemAndGoals.files,
    ...answers.process.files,
    ...answers.solution.files,
    ...answers.impactAndLearnings.files,
  ];
  return allFiles.filter((f) => IMAGE_TYPES.includes(f.type));
}

export const SYSTEM_PROMPT = `You are an expert UX portfolio writer. Your task is to synthesize raw project notes and answers into a polished, professional portfolio case study.

Structure the output with these sections (use markdown headers ##):
1. **Overview** - Brief project context and goals
2. **Problem** - The challenge and target users
3. **Process** - Research, ideation, iteration, and key decisions
4. **Solution** - Final design, rationale, and tradeoffs
5. **Impact** - Outcomes, metrics, and feedback
6. **Learnings** - Personal takeaways and reflections

Write in a professional, concise tone. Use the user's own words where possible but polish for clarity. If the user included images, reference what they show when relevant. Output only the case study content in markdown, no meta-commentary.`;
