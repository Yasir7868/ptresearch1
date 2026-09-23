import Link from "next/link";
import type { ReactNode } from "react";
import { CircleAlert, TriangleAlert, type LucideIcon } from "lucide-react";
import type { WooProblem } from "@/lib/admin/woo/client";
import { cn } from "@/lib/utils";

/** A WooCommerce read that failed, explained with what to do about it. */
export function ProblemPanel({
  problem,
  title = "Couldn't load this from WooCommerce",
  canFix,
  className,
}: {
  problem: WooProblem;
  title?: string;
  /** Show the link to Settings (owners). */
  canFix?: boolean;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("soft-card border-l-4 border-l-error p-5", className)}>
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-error" />
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink">{title}</p>
          <p className="mt-1 text-ink">{problem.message}</p>
          {problem.hint && <p className="mt-1.5 text-ink-muted">{problem.hint}</p>}
          {canFix && (problem.kind === "not_configured" || problem.kind === "unauthorized" || problem.kind === "forbidden") && (
            <Link href="/admin/settings" className="mt-3 inline-block font-medium text-green underline-offset-4 hover:underline">
              Open connection settings
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function Notice({
  children,
  tone = "warning",
  icon: Icon = TriangleAlert,
  className,
}: {
  children: ReactNode;
  tone?: "warning" | "info";
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-ink",
        tone === "warning" ? "warn-line" : "bg-[color-mix(in_oklab,var(--green)_7%,white)]",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-[18px] shrink-0",
          tone === "warning" ? "text-[color-mix(in_oklab,var(--amber)_50%,var(--ink))]" : "text-green"
        )}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-secondary">
        <Icon aria-hidden="true" className="size-5 text-ink-muted" />
      </span>
      <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-muted">{children}</div>}
    </div>
  );
}
