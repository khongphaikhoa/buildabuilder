"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProject } from "@/lib/storage/projects";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (projectId) {
      const project = getProject(projectId);
      if (project) {
        router.replace(`/project/${project.id}/result`);
        return;
      }
    }
    router.replace("/");
  }, [projectId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <p className="text-stone-600">Redirecting...</p>
    </div>
  );
}
