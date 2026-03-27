import { z } from "zod";

export const QUESTION_SECTIONS = [
  "contextAndProblem",
  "projectOverview",
  "problemAndGoals",
  "process",
  "solution",
  "impactAndLearnings",
  "roleAndCollaboration",
  "impactAndCollaboration",
  "traceAndExecution",
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

export const questionnaireAnswersSchemaV1 = z.object({
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

export const traceInsightSchema = z.object({
  id: z.string(),
  text: z.string().default(""),
  evidenceFileIds: z.array(z.string()).default([]),
});

export const traceDecisionSchema = z.object({
  id: z.string(),
  text: z.string().default(""),
  execution: z.string().default(""),
  decisionRationale: z.string().optional().default(""),
  linkedInsightIds: z.array(z.string()).default([]),
});

export const insightToDecisionLinkSchema = z.object({
  insightId: z.string(),
  decisionId: z.string(),
});

export const traceAndExecutionSchema = z.object({
  evidenceFiles: z.array(uploadFileSchema).default([]),
  insights: z.array(traceInsightSchema).default([]),
  decisions: z.array(traceDecisionSchema).default([]),
  insightToDecision: z.array(insightToDecisionLinkSchema).default([]),
});

export const questionnaireAnswersSchemaV2 = z.object({
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
  traceAndExecution: traceAndExecutionSchema,
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

export const questionnaireAnswersSchema = z.union([
  questionnaireAnswersSchemaV1,
  questionnaireAnswersSchemaV2,
]);

export type QuestionnaireAnswersV1 = z.infer<typeof questionnaireAnswersSchemaV1>;
export type QuestionnaireAnswersV2 = z.infer<typeof questionnaireAnswersSchemaV2>;
export type QuestionnaireAnswers = QuestionnaireAnswersV1 | QuestionnaireAnswersV2;
export type UploadFile = z.infer<typeof uploadFileSchema>;

export const QUESTION_GROUPS: {
  id: QuestionSection;
  title: string;
  questions: {
    key: string;
    label: string;
    placeholder?: string;
    type?: "text" | "textarea";
    fileUpload?: boolean;
  }[];
}[] = [
  {
    id: "contextAndProblem",
    title: "Context & Problem",
    questions: [],
  },
  {
    id: "traceAndExecution",
    title: "Traceability Builder (Insight → Decision)",
    questions: [],
  },
  {
    id: "impactAndCollaboration",
    title: "Impact & Collaboration",
    questions: [],
  },
];

export const defaultAnswers: QuestionnaireAnswersV2 = {
  projectOverview: { projectName: "", clientContext: "", timeline: "" },
  problemAndGoals: { problem: "", targetUsers: "", successCriteria: "", files: [] },
  traceAndExecution: {
    evidenceFiles: [],
    insights: [],
    decisions: [],
    insightToDecision: [],
  },
  impactAndLearnings: { metrics: "", feedback: "", personalLearnings: "", files: [] },
  roleAndCollaboration: { contribution: "", teamSize: "", stakeholders: "" },
};
