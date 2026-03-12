import { NextRequest } from "next/server";
import { get } from "@vercel/blob";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    const pathname = `project/${id}.json`;
    const blob = await get(pathname, { access: "public" });
    if (!blob) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    const text = await blob.text();
    const data = JSON.parse(text);
    return Response.json(data);
  } catch (err) {
    console.error("Fetch project error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Project not found" },
      { status: 404 }
    );
  }
}
