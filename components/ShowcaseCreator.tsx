"use client";

import { useState } from "react";
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
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F8F9FA] text-[#1A1A1A] font-sans antialiased">
  <div class="max-w-3xl mx-auto px-6 py-12">
    <h1 class="text-3xl font-bold mb-12 tracking-tight text-[#1A1A1A]">${escapeHtml(title)}</h1>
    ${items
      .map(
        (item) => `
    <section class="mb-16">
      <h2 class="text-2xl font-semibold text-[#1A1A1A] mb-6">${escapeHtml(item.name)}</h2>
      <div class="text-[#1A1A1A]/80 whitespace-pre-wrap leading-relaxed">${item.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
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
      <div className="rounded-[32px] border-2 border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-ink/70">No completed projects yet</p>
        <p className="mt-2 text-sm text-ink/50">
          Complete at least one project with a generated case study to create a showcase
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex px-6 py-3 text-base">
          Go to Projects
        </Link>
      </div>
    );
  }

  if (shareUrl) {
    return (
      <div className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-bold tracking-tighthead text-ink">Your showcase is live</h2>
        <p className="mt-2 text-ink/60">Share this link:</p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 rounded-2xl border border-gray-100 px-4 py-2 text-ink"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="btn-primary shrink-0"
          >
            Copy
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Open Showcase
          </a>
          <button
            type="button"
            onClick={() => setShareUrl(null)}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:bg-gray-50"
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
        <label className="block text-sm font-medium text-ink/80">Showcase title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-2 w-full max-w-md rounded-2xl border border-gray-100 bg-white px-4 py-2 text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="My Portfolio"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink/80">Select projects to include</h3>
        <ul className="mt-3 space-y-2">
          {projects.map((p) => {
            const name = p.answers.projectOverview.projectName || p.name;
            const isSelected = selectedIds.has(p.id);
            const idx = order.indexOf(p.id);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProject(p.id)}
                  className="h-4 w-4 rounded border-gray-100 text-primary focus:ring-primary"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{name}</span>
                {isSelected && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(p.id)}
                      disabled={idx <= 0}
                      className="rounded-lg p-1 text-ink/50 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(p.id)}
                      disabled={idx < 0 || idx >= selectedIds.size - 1}
                      className="rounded-lg p-1 text-ink/50 hover:bg-gray-50 disabled:opacity-40"
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

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePublish}
          disabled={isPublishing || selectedIds.size === 0}
          className="btn-primary px-6 py-2 disabled:opacity-50"
        >
          {isPublishing ? "Publishing..." : "Publish & Get Link"}
        </button>
        <button
          type="button"
          onClick={handleExportHtml}
          disabled={selectedIds.size === 0}
          className="btn-secondary px-6 py-2 disabled:opacity-50"
        >
          Export as HTML
        </button>
        <Link
          href="/"
          className="rounded-full px-6 py-2 text-sm font-medium text-ink/60 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
