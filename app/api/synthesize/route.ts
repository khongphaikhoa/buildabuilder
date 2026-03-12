import { NextRequest } from "next/server";
import { synthesizeCaseStudy } from "@/lib/ai/client";
import { questionnaireAnswersSchema } from "@/lib/questionnaire/schema";

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const parsed = questionnaireAnswersSchema.safeParse(body.answers);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid answers", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of synthesizeCaseStudy(parsed.data)) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error("Synthesis error:", err);
          controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : "Synthesis failed"}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Synthesize API error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
