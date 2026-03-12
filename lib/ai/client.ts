import OpenAI from "openai";
import { buildUserPrompt, getImageFiles, SYSTEM_PROMPT } from "./prompts";
import type { QuestionnaireAnswers, UploadFile } from "@/lib/questionnaire/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function* synthesizeCaseStudy(
  answers: QuestionnaireAnswers
): AsyncGenerator<string, void, unknown> {
  const userPrompt = buildUserPrompt(answers);
  const imageFiles = getImageFiles(answers);

  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    { type: "text", text: userPrompt },
  ];

  for (const file of imageFiles.slice(0, 10)) {
    const url = file.base64.startsWith("data:") ? file.base64 : `data:${file.type};base64,${file.base64}`;
    content.push({
      type: "image_url",
      image_url: {
        url,
        detail: "low" as const,
      },
    });
  }

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
