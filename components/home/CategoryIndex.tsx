/**
 * CategoryIndex — the Categories CHAPTER BAND (DESIGN §7.6 + judge graft #5):
 * a full-bleed green band carrying the nine taxonomy categories as a
 * DOT-LEADER table of contents — `name … live count` — that doubles as
 * navigation. Verbatim blurbs sit under each name; the band's amber display
 * element is the real category count set at poster scale. Enters with the
 * signature InkWipe flood.
 *
 * Server component; counts are computed server-side in app/page.tsx with the
 * SAME membership rule as /catalog/[category] (primary OR secondary), so the
 * index always matches the listings.
 */

import Link from "next/link";
import type { CSSProperties } from "react";
import { InkWipe } from "@/components/motion/InkWipe";

export interface CategoryRow {
  slug: string;
  name: string;
  blurb: string;
  count: number;
}

/** Print-style dot leader — rendered with currentColor so it inherits mint. */
const DOT_LEADER: CSSProperties = {
  backgroundImage:
    "radial-gradient(circle, currentColor 1.2px, transparent 1.7px)",
  backgroundSize: "11px 3px",
  backgroundRepeat: "repeat-x",
  backgroundPosition: "0 center",
};

export function CategoryIndex({ categories }: { categories: CategoryRow[] }) {
  return (
    <InkWipe>
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        {/* Band header — kicker + heading left, amber display count right. */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="micro-label-dark">Index</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
              Browse by research category
            </h2>
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <p className="amber-display font-display text-[clamp(3rem,6vw,5rem)] leading-none font-bold tracking-[-0.02em] [font-variant-numeric:tabular-nums_lining-nums]">
              {String(categories.length).padStart(2, "0")}
            </p>
            <p className="micro-label-dark mt-2">Categories</p>
          </div>
        </div>

        {/* Dot-leader table of contents. */}
        <ol className="mt-12 border-t border-mint/20">
          {categories.map((cat, i) => (
            <li key={cat.slug}>
              <Link
                href={`/catalog/${cat.slug}`}
                className="group block border-b border-mint/20 py-5 md:py-6"
              >
                <span className="flex items-baseline gap-4 md:gap-6">
                  <span className="data-num w-7 shrink-0 text-[13px] text-mint/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-[clamp(1.35rem,2.3vw,1.9rem)] leading-tight font-semibold tracking-[-0.02em] text-(--mint-bright) transition-colors group-hover:text-surface">
                    {cat.name}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-[3px] min-w-8 flex-1 self-center text-mint/45"
                    style={DOT_LEADER}
                  />
                  <span className="data-num shrink-0 text-[15px] text-(--mint-bright)">
                    {String(cat.count).padStart(2, "0")}
                  </span>
                </span>
                <span className="mt-1.5 block max-w-2xl pl-11 text-[13px] leading-relaxed text-mint/70 md:pl-13">
                  {cat.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-10">
          <Link
            href="/catalog"
            className="text-sm font-[540] text-(--mint-bright) underline-offset-4 transition-colors hover:text-surface hover:underline"
          >
            View full catalog →
          </Link>
        </p>
      </div>
    </InkWipe>
  );
}
