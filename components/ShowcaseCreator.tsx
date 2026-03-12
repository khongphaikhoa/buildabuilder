"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/lib/storage/projects";
import type { Project } from "@/lib/storage/projects";

export function ShowcaseCreator() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("My Portfolio");
  const [order, setOrder] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projects = listProjects().filter((p) => p.synthesizedContent);

  const toggleProject = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setOrder((o) => o.filter((x) => next.has(x)).concat([...next].filter((x) => !o.includes(x))));
      return next;
    });
  };

  const moveUp = (id: string) => {
    setOrder((o) => {
      const i = o.indexOf(id);
      if (i <= 0) return o;
      const next = [...o];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const moveDown = (id: string) => {
    setOrder((o) => {
      const i = o.indexOf(id);
      if (i < 0 || i >= o.length - 1) return o;
      const next = [...o];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedIds.size === 0) {
      setError("Select at least one project");
      return;
    }
    setError(null);
    setIsPublishing(true);

    const ordered = order.length > 0
      ? order.filter((id) => selectedIds.has(id))
      : [...selectedIds];
    const payload = ordered.map((id) => {
      const p = projects.find((x) => x.id === id);
      return {
        name: p?.answers.projectOverview.projectName || p?.name || "Untitled",
        content: p?.synthesizedContent || "",
      };
    });

    try {
      const res = await fetch("/api/publish-showcase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projects: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");
      const base = typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${base}/showcase/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleExportHtml = () => {
    if (selectedIds.size === 0) {
      setError("Select at least one project");
      return;
    }
    const ordered = order.length > 0 ? order.filter((id) => selectedIds.has(id)) : [...selectedIds];
    const items = ordered.map((id) => {
      const p = projects.find((x) => x.id === id);
      return {
        name: p?.answers.projectOverview.projectName || p?.name || "Untitled",
        content: p?.synthesizedContent || "",
      };
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-stone-50 text-stone-800 font-sans">
  <div class="max-w-3xl mx-auto px-6 py-12">
    <h1 class="text-3xl font-bold mb-12">${title}</h1>
    ${items
      .map(
        (item) => `
    <section class="mb-16">
      <h2 class="text-2xl font-semibold text-stone-900 mb-6">${item.name}</h2>
      <div class="prose prose-stone max-w-none text-stone-700 whitespace-pre-wrap">${item.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    </section>`
      )
      .join("")}
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "portfolio-showcase.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-12 text-center">
        <p className="text-stone-600">No completed projects yet</p>
        <p className="mt-2 text-sm text-stone-500">
          Complete at least one project with a generated case study to create a showcase
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          Go to Projects
        </Link>
      </div>
    );
  }

  if (shareUrl) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-900">Your showcase is live</h2>
        <p className="mt-2 text-stone-600">Share this link:</p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 rounded-lg border border-stone-300 px-4 py-2 text-stone-700"
          />
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            Copy
          </button>
        </div>
        <div className="mt-6 flex gap-3">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Open Showcase
          </a>
          <button
            onClick={() => setShareUrl(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-stone-700">Showcase title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full max-w-md rounded-lg border border-stone-300 px-4 py-2 text-stone-900"
          placeholder="My Portfolio"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-stone-700">Select projects to include</h3>
        <ul className="mt-3 space-y-2">
          {projects.map((p) => {
            const name = p.answers.projectOverview.projectName || p.name;
            const isSelected = selectedIds.has(p.id);
            const idx = order.indexOf(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProject(p.id)}
                  className="h-4 w-4 rounded border-stone-300"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-stone-900">{name}</span>
                {isSelected && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(p.id)}
                      disabled={idx <= 0}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(p.id)}
                      disabled={idx < 0 || idx >= selectedIds.size - 1}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={isPublishing || selectedIds.size === 0}
          className="rounded-lg bg-stone-900 px-6 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {isPublishing ? "Publishing..." : "Publish & Get Link"}
        </button>
        <button
          onClick={handleExportHtml}
          disabled={selectedIds.size === 0}
          className="rounded-lg border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          Export as HTML
        </button>
        <Link
          href="/"
          className="rounded-lg px-6 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
