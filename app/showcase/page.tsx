"use client";

import Link from "next/link";
import { ShowcaseCreator } from "@/components/ShowcaseCreator";
import { GlassNav } from "@/components/GlassNav";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-background">
      <GlassNav>
        <Link
          href="/"
          className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
        >
          ← Projects
        </Link>
      </GlassNav>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-bold tracking-tighthead text-ink">
          Create Showcase
        </h1>
        <p className="mb-8 text-ink/60">
          Select projects to include in a shareable portfolio page. Publish to get a link, or export as HTML to host elsewhere.
        </p>
        <ShowcaseCreator />
      </main>
    </div>
  );
}
