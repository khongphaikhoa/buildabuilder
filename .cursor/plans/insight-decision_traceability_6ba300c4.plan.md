---
name: Insight-Decision Traceability
overview: Extend the questionnaire data model to support explicit Evidence→Execution traceability via an Insight→Decision mapping, and update prompt-building so the AI can synthesize with traceability.
todos: []
isProject: false
---

# [260326] Insight-to-Decision Traceability (Evidence-to-Execution)

## Goal

Add an explicit structure that links **evidence** (uploaded notes/photos) to **execution outcomes** via:

- **insights** (what you learned)
- **decisions** (what you chose to do)
- **insightToDecision links** (which decisions were driven by which insights)

You requested:

- Structured IDs (`insights[]`, `decisions[]`, mapping links)
- Merge “Process” + “Solution” into a single combined step that shows how these elements connect

## Current implementation (what we need to change)

- Questionnaire answers are currently bucketed as `process` and `solution` with plain text fields plus `files` arrays.
- Evidence (uploads) is stored but not linked to any insight/decision.
- AI prompt builder (`buildUserPrompt()` in `[lib/ai/prompts.ts]`) currently dumps text fields and uploaded text-file contents, without any mapping.

## Proposed data structure (QuestionnaireAnswers v2)

Add a new combined section, e.g. `traceAndExecution`, containing:

- `evidenceFiles`: array of `UploadFile` (reuse current UploadFile type)
- `insights`: array of `{ id, text, evidenceFileIds: string[] }`
- `decisions`: array of `{ id, text, execution: string, decisionRationale?: string, linkedInsightIds: string[] }`
- `insightToDecision`: array of `{ insightId, decisionId }` (explicit many-to-many)

Notes:

- We keep `evidenceFileIds` on insights (evidence→insight).
- We keep both `linkedInsightIds` on decisions and an explicit `insightToDecision` mapping; you can use either in UI/AI, but the mapping array is the explicit “Insight-to-Decision” requirement.

## Compatibility requirement

Because the synthesis API validates the payload with Zod (`[app/api/synthesize/route.ts]` uses `questionnaireAnswersSchema.safeParse(body.answers)`), we must keep old projects from breaking.

Plan:

- Keep the existing schema as a `v1` variant.
- Extend/export a `questionnaireAnswersSchema` that accepts either `v1` or `v2`.
- Update prompt builder to support both formats.

## Implementation steps

### 1. Update Zod schema

**File:** `[lib/questionnaire/schema.ts]`

- Add new exported types:
  - `InsightItem`
  - `DecisionItem`
  - `InsightToDecisionLink`
  - optionally `TraceAndExecutionAnswers`
- Add `traceAndExecution` into the new questionnaire shape.
- Keep the old `process` + `solution` keys as part of `v1` schema.
- Export `questionnaireAnswersSchema` as a union:
  - `z.union([questionnaireAnswersSchemaV1, questionnaireAnswersSchemaV2])`
- Update `defaultAnswers` to include the new `traceAndExecution` structure.

### 2. Update questionnaire step UI (merge Process+Solution)

**Files:**

- `[components/QuestionStep.tsx]`
- `[components/FileUpload.tsx]` (small extension)
- Add a dedicated client component, e.g. `TraceabilityBuilder.tsx`, used when the current section is the merged one.
- Replace the generic rendering for the merged section with custom UI that supports:
  - Upload evidence files (reusing `FileUpload`)
  - Add/edit multiple insights (each insight selects evidence file(s) by checkbox using upload `id`s)
  - Add/edit multiple decisions (each decision includes execution text)
  - Create Insight→Decision mapping:
    - UI for selecting mapping links (checkbox matrix or multi-select)
- Update `FileUpload` only if needed so the uploaded items are stored in `traceAndExecution.evidenceFiles` instead of the old per-section `files` buckets.

### 3. Update prompt building to include mapping

**File:** `[lib/ai/prompts.ts]`

- Update `buildUserPrompt()` to:
  - Detect whether answers include `traceAndExecution` (v2) or `process/solution` (v1)
  - For v2:
    - Include insights + their evidence sources
    - Include decisions + their execution text
    - Include explicit `insightToDecision` mapping
  - For v1:
    - Preserve existing behavior.
- Update `SYSTEM_PROMPT` with additional instruction when v2 is present:
  - “When traceability data is provided, explicitly connect each key decision to the insight(s) that drove it, and reference which evidence uploads support that insight.”

### 4. Update synthesis validation + payload expectations (no API changes expected)

**File:** `[app/api/synthesize/route.ts]`

- Likely no structural change beyond ensuring it can parse both schema versions.
- Confirm Zod union works with `request.json()` payload.

## Data flow (after change)

```mermaid
flowchart LR
  UserUploads[Upload evidence files] --> TraceUI[Traceability Builder UI]
  TraceUI --> Answers[answers.traceAndExecution (evidence/insights/decisions/mapping)]
  Answers --> Synthesize[POST /api/synthesize]
  Synthesize --> Prompt[buildUserPrompt() includes insightToDecision]
  Prompt --> AI[AI generates case study with traceability]
```



## Key files touched (for review)

- `[lib/questionnaire/schema.ts]`
- `[components/QuestionStep.tsx]`
- `[components/FileUpload.tsx]` (only if needed)
- `components/TraceabilityBuilder.tsx` (new)
- `[lib/ai/prompts.ts]`
- `[app/api/synthesize/route.ts]` (verify union compatibility)

## Definition of done

- The questionnaire supports evidence→insight, insight→decision mapping.
- The AI prompt contains the mapping so outputs can be traced.
- Old projects still synthesize successfully (v1 schema remains valid).

