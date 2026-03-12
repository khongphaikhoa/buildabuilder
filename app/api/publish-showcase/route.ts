import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export interface ShowcasePayload {
  title?: string;
  projects: { name: string; content: string }[];
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ShowcasePayload;
    if (!body.projects || !Array.isArray(body.projects) || body.projects.length === 0) {
      return Response.json(
        { error: "At least one project is required" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID().slice(0, 8);
    const pathname = `showcase/${id}.json`;
    const payload = JSON.stringify({
      title: body.title || "My Portfolio",
      projects: body.projects.map((p) => ({
        name: p.name,
        content: p.content,
      })),
    });

    await put(pathname, payload, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return Response.json({ id });
  } catch (err) {
    console.error("Publish showcase error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to publish" },
      { status: 500 }
    );
  }
}
