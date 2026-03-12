"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProject, createProject } from "@/lib/storage/projects";

export default function QuestionnairePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get("projectId");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (projectId) {
      const project = getProject(projectId);
      if (project) {
        router.replace(`/project/${project.id}/edit`);
        return;
      }
    }
    const newProject = createProject();
    router.replace(`/project/${newProject.id}/edit`);
  }, [projectId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <p className="text-stone-600">Redirecting...</p>
    </div>
  );
}
