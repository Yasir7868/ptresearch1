/**
 * Shared bits of the 2026-09 CRO redesign homepage (DESIGN.md §0): the page
 * container, the cobalt kicker, and the serif section-heading face. Every
 * landing section renders inside `<main className="landing">` (app/(store)/
 * page.tsx), which lets these heading utilities win over the global h1–h4
 * rule (globals.css, "Redesign scope").
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 1240px content column with 24px gutters. */
export const CONTAINER = "mx-auto w-full max-w-[1240px] px-6";

/** Section heading face — Source Serif 4 600. Size + spacing per section. */
export const SERIF = "font-serif font-semibold";

/** Primary action — cobalt, 52px tall. */
export const PRIMARY_CTA =
  "inline-flex h-[52px] items-center gap-2.5 rounded-[12px] bg-cobalt px-[26px] text-[16px] font-bold text-white transition-colors hover:bg-cobalt-bright hover:text-white";

export function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[12px] font-bold tracking-[0.16em] text-cobalt uppercase",
        className
      )}
    >
      {children}
    </p>
  );
}

/** The design's trailing "→" on links and buttons (decorative). */
export function Arrow() {
  return <span aria-hidden="true">→</span>;
}
