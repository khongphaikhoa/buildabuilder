"use client";

import Link from "next/link";
import { ShowcaseCreator } from "@/components/ShowcaseCreator";

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            ← Projects
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-bold text-stone-900">
          Create Showcase
        </h1>
        <p className="mb-8 text-stone-600">
          Select projects to include in a shareable portfolio page. Publish to get a link, or export as HTML to host elsewhere.
        </p>
        <ShowcaseCreator />
      </main>
    </div>
  );
}
