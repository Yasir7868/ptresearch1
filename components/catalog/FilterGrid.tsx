"use client";

/**
 * FilterGrid — the client half of the catalog: sticky hairline filter bar
 * (category chips + search + sort) above a 3-up grid of specimen-plate
 * ProductCards (D3 "Reference Grade").
 *
 * - Server pages fetch getCatalog() once and pass plain Product[] down.
 * - `showCategoryFilter` renders the All + 9-category chip row (/catalog);
 *   category pages omit it and pass a pre-filtered list.
 * - Category chips match primary OR secondary category (same rule as the
 *   /catalog/[category] routes). Search matches name/SKU, case-insensitive.
 * - Grid: 1-up mobile / 2-up tablet / 3-up desktop with generous gaps so the
 *   soft cards breathe (their shadows need the negative space).
 * - Entrance: cards fade + rise with a short row stagger as they enter the
 *   viewport (REFERENCE_EASE, ~70ms). Keys are stable (productId), so cards
 *   that survive a filter/sort change never re-animate — only newly added
 *   cards fade in. Respects prefers-reduced-motion (opacity only).
 *
 * Restyle notes (soft pass 2026-07): inputs are 10px radius, category chips
 * are full pills (DESIGN §4 soft scale); green is the sole interactive color
 * on paper; active chip is navy-filled with mint count. Amber never appears
 * as text here.
 *
 * Sticky offset: the Header is `sticky top-0` at h-16, so this bar pins at
 * top-16 with a lower z-index (header z-40, bar z-30).
 */

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SearchIcon } from "lucide-react";
import { CATEGORIES } from "@/content/taxonomy";
import type { Product } from "@/lib/woo/types";
import { cn } from "@/lib/utils";
import { REFERENCE_EASE } from "@/components/motion/InkWipe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "./ProductCard";
import { purityValue } from "./format";

type SortKey = "name-asc" | "price-asc" | "price-desc" | "purity-desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name-asc", label: "Name A–Z" },
  { value: "price-asc", label: "Price low–high" },
  { value: "price-desc", label: "Price high–low" },
  { value: "purity-desc", label: "Purity high–low" },
];

/** Does the product belong to the given category (primary or secondary)? */
function inCategory(p: Product, categorySlug: string): boolean {
  return (
    p.categorySlug === categorySlug ||
    p.secondaryCategories.includes(categorySlug)
  );
}

export function FilterGrid({
  products,
  showCategoryFilter = false,
}: {
  products: Product[];
  showCategoryFilter?: boolean;
}) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const reduced = useReducedMotion();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of CATEGORIES) {
      map.set(c.slug, products.filter((p) => inCategory(p, c.slug)).length);
    }
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (showCategoryFilter && category !== "all") {
      list = list.filter((p) => inCategory(p, category));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "name-asc":
        sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.priceMinor - b.priceMinor);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.priceMinor - a.priceMinor);
        break;
      case "purity-desc":
        sorted.sort((a, b) => {
          const pa = purityValue(a.purity);
          const pb = purityValue(b.purity);
          if (pa === null && pb === null)
            return a.displayName.localeCompare(b.displayName);
          if (pa === null) return 1;
          if (pb === null) return -1;
          return pb - pa;
        });
        break;
    }
    return sorted;
  }, [products, showCategoryFilter, category, query, sort]);

  const hasActiveFilter = query.trim() !== "" || category !== "all";

  function resetFilters() {
    setQuery("");
    setCategory("all");
  }

  return (
    <section>
      {/* ── Sticky filter bar ──────────────────────────────────────────── */}
      <div className="hairline-y sticky top-16 z-30 bg-bg">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:px-6 lg:flex-row lg:items-center lg:gap-6">
          {showCategoryFilter && (
            <div
              role="group"
              aria-label="Filter by category"
              className="-mx-4 flex gap-2 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] md:-mx-6 md:px-6 lg:mx-0 lg:flex-1 lg:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <CategoryChip
                label="All"
                count={products.length}
                active={category === "all"}
                onClick={() => setCategory("all")}
              />
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c.slug}
                  label={c.name}
                  count={counts.get(c.slug) ?? 0}
                  active={category === c.slug}
                  onClick={() => setCategory(c.slug)}
                />
              ))}
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-3",
              showCategoryFilter ? "lg:shrink-0" : "w-full"
            )}
          >
            {/* Search — soft 10px input (matches the ui/* control radius) */}
            <div
              className={cn(
                "relative flex-1",
                showCategoryFilter ? "lg:w-60 lg:flex-none" : "lg:max-w-sm"
              )}
            >
              <SearchIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or SKU"
                aria-label="Search compounds by name or SKU"
                className="h-9 w-full rounded-lg border border-hairline bg-surface pr-3 pl-9 text-[13px] text-ink transition-colors placeholder:text-ink-muted/70 focus:border-green focus:outline-none"
              />
            </div>

            {/* Sort */}
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger
                aria-label="Sort products"
                className="h-9 shrink-0 border-hairline bg-surface text-[12px] font-medium text-ink"
              >
                <span className="text-[10px] font-medium tracking-[0.14em] text-ink-muted uppercase">
                  Sort
                </span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end" sideOffset={4}>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-[12px]"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Live result count — reference-record precision */}
            <span
              aria-live="polite"
              className="data-num hidden text-[11px] whitespace-nowrap text-ink-muted md:inline"
            >
              <span className="text-green">{filtered.length}</span>/
              {products.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Specimen-plate grid ────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        {filtered.length > 0 ? (
          <ul className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p, i) => (
              <motion.li
                key={p.productId}
                /* min-w-0: grid items default to min-width:auto — long
                   SKUs/labels would widen the track past the viewport */
                className="min-w-0"
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                transition={{
                  duration: 0.5,
                  ease: REFERENCE_EASE,
                  delay: (i % 3) * 0.07,
                }}
              >
                <ProductCard product={p} />
              </motion.li>
            ))}
          </ul>
        ) : (
          <div className="soft-card mx-auto max-w-2xl px-6 py-16 text-center">
            <p className="micro-label">No results</p>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
              {query.trim()
                ? `No compounds match “${query.trim()}”.`
                : "No compounds match the current filters."}
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 text-[12px] font-medium tracking-[0.12em] text-green uppercase transition-colors hover:text-green-deep"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** Category filter chip — a soft full pill (DESIGN §4 soft scale).
    Active = navy-filled with mint count; green is the only interactive
    color on paper (amber is never text here). */
function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
        active
          ? "border-green bg-green text-surface"
          : "border-hairline bg-surface text-ink-muted hover:border-green/50 hover:text-green"
      )}
    >
      {label}
      <span
        className={cn(
          "data-num text-[10px]",
          active ? "text-mint" : "text-ink-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}
