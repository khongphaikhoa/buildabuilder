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
    const result = await get(pathname, { access: "public" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }
    const text = await new Response(result.stream).text();
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
