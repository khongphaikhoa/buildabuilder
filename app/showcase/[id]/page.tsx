"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShowcaseView } from "@/components/ShowcaseView";

interface ShowcaseData {
  title: string;
  projects: { name: string; content: string }[];
}

export default function ShowcasePublicPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    fetch(`/api/showcase/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Showcase not found");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  if (!id) return null;
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-800" />
          <p className="text-sm text-stone-600">Loading showcase...</p>
        </div>
      </div>
    );
  }

  return <ShowcaseView title={data.title} projects={data.projects} />;
}
