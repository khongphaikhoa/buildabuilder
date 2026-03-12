import { z } from "zod";

export const QUESTION_SECTIONS = [
  "projectOverview",
  "problemAndGoals",
  "process",
  "solution",
  "impactAndLearnings",
  "roleAndCollaboration",
] as const;

export type QuestionSection = (typeof QUESTION_SECTIONS)[number];

export const uploadFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  base64: z.string(),
  caption: z.string().optional(),
  section: z.enum(QUESTION_SECTIONS),
});

export const questionnaireAnswersSchema = z.object({
  projectOverview: z.object({
    projectName: z.string().default(""),
    clientContext: z.string().default(""),
    timeline: z.string().default(""),
  }),
  problemAndGoals: z.object({
    problem: z.string().default(""),
    targetUsers: z.string().default(""),
    successCriteria: z.string().default(""),
    files: z.array(uploadFileSchema).default([]),
  }),
  process: z.object({
    research: z.string().default(""),
    ideation: z.string().default(""),
    iteration: z.string().default(""),
    keyDecisions: z.string().default(""),
    files: z.array(uploadFileSchema).default([]),
  }),
  solution: z.object({
    finalDesign: z.string().default(""),
    rationale: z.string().default(""),
    tradeoffs: z.string().default(""),
    files: z.array(uploadFileSchema).default([]),
  }),
  impactAndLearnings: z.object({
    metrics: z.string().default(""),
    feedback: z.string().default(""),
    personalLearnings: z.string().default(""),
    files: z.array(uploadFileSchema).default([]),
  }),
  roleAndCollaboration: z.object({
    contribution: z.string().default(""),
    teamSize: z.string().default(""),
    stakeholders: z.string().default(""),
  }),
});

export type QuestionnaireAnswers = z.infer<typeof questionnaireAnswersSchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;

export const QUESTION_GROUPS: {
  id: QuestionSection;
  title: string;
  questions: { key: keyof QuestionnaireAnswers[QuestionSection]; label: string; placeholder?: string; type?: "text" | "textarea"; fileUpload?: boolean }[];
}[] = [
  {
    id: "projectOverview",
    title: "Project Overview",
    questions: [
      { key: "projectName", label: "Project name", placeholder: "e.g., Redesign checkout flow" },
      { key: "clientContext", label: "Client or context", placeholder: "e.g., E-commerce startup, 2024" },
      { key: "timeline", label: "Timeline", placeholder: "e.g., 5 weeks, Jan–Feb 2024" },
    ],
  },
  {
    id: "problemAndGoals",
    title: "Problem & Goals",
    questions: [
      { key: "problem", label: "What problem were you solving?", type: "textarea" },
      { key: "targetUsers", label: "Who were the target users?", type: "textarea" },
      { key: "successCriteria", label: "What were the success criteria?", type: "textarea" },
      { key: "files", label: "Upload process notes or sketches", fileUpload: true },
    ],
  },
  {
    id: "process",
    title: "Process",
    questions: [
      { key: "research", label: "What research did you do?", type: "textarea" },
      { key: "ideation", label: "How did you ideate?", type: "textarea" },
      { key: "iteration", label: "How did you iterate?", type: "textarea" },
      { key: "keyDecisions", label: "What were the key design decisions?", type: "textarea" },
      { key: "files", label: "Upload process notes or photos", fileUpload: true },
    ],
  },
  {
    id: "solution",
    title: "Solution",
    questions: [
      { key: "finalDesign", label: "Describe the final design", type: "textarea" },
      { key: "rationale", label: "Why did you choose this approach?", type: "textarea" },
      { key: "tradeoffs", label: "What tradeoffs did you make?", type: "textarea" },
      { key: "files", label: "Upload screenshots or mockups", fileUpload: true },
    ],
  },
  {
    id: "impactAndLearnings",
    title: "Impact & Learnings",
    questions: [
      { key: "metrics", label: "What metrics or outcomes did you see?", type: "textarea" },
      { key: "feedback", label: "What feedback did you receive?", type: "textarea" },
      { key: "personalLearnings", label: "What did you learn personally?", type: "textarea" },
      { key: "files", label: "Optional uploads", fileUpload: true },
    ],
  },
  {
    id: "roleAndCollaboration",
    title: "Role & Collaboration",
    questions: [
      { key: "contribution", label: "What was your contribution?", type: "textarea" },
      { key: "teamSize", label: "Team size", placeholder: "e.g., 3 designers, 2 devs" },
      { key: "stakeholders", label: "Who were the stakeholders?", type: "textarea" },
    ],
  },
];

export const defaultAnswers: QuestionnaireAnswers = {
  projectOverview: { projectName: "", clientContext: "", timeline: "" },
  problemAndGoals: { problem: "", targetUsers: "", successCriteria: "", files: [] },
  process: { research: "", ideation: "", iteration: "", keyDecisions: "", files: [] },
  solution: { finalDesign: "", rationale: "", tradeoffs: "", files: [] },
  impactAndLearnings: { metrics: "", feedback: "", personalLearnings: "", files: [] },
  roleAndCollaboration: { contribution: "", teamSize: "", stakeholders: "" },
};
