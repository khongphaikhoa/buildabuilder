import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";
import type { Project } from "@/lib/storage/projects";

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateShortId(): string {
  return Array.from(randomBytes(8), (b) => CHARS[b % 36]).join("");
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as { project: Project };
    if (!body.project || typeof body.project !== "object") {
      return Response.json(
        { error: "Project object is required" },
        { status: 400 }
      );
    }

    const id = generateShortId();
    const pathname = `project/${id}.json`;
    const payload = JSON.stringify(body.project);

    await put(pathname, payload, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return Response.json({ id });
  } catch (err) {
    console.error("Publish project error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to publish" },
      { status: 500 }
    );
  }
}
