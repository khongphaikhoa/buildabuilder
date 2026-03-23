import type { ReactNode } from "react";
import Link from "next/link";
import { GlassNav } from "@/components/GlassNav";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, backHref, backLabel = "Back", actions }: PageHeaderProps) {
  return (
    <GlassNav>
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm font-medium text-ink/60 transition-colors hover:text-ink"
          >
            ← {backLabel}
          </Link>
        ) : null}
        <h1
          className={`text-xl font-bold tracking-tighthead text-ink ${backHref ? "mt-2" : ""}`}
        >
          {title}
        </h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </GlassNav>
  );
}
