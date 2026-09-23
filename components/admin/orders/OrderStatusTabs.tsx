import Link from "next/link";
import { formatCount } from "@/lib/admin/money";
import { statusMeta } from "@/lib/admin/order-status";
import { cn } from "@/lib/utils";
import { hrefWith } from "../Pagination";

/**
 * "All (1,204) | Processing (6) | On hold (2) | …" — the same status views as
 * WooCommerce's own orders screen. Statuses with no orders are hidden, except
 * the one being viewed.
 */
export function OrderStatusTabs({
  statuses,
  counts,
  current,
  params,
}: {
  statuses: { slug: string; name: string }[];
  counts: Record<string, number> | null;
  current: string;
  params: Record<string, string | undefined>;
}) {
  const tabs = [
    { slug: "all", label: "All", count: counts?.all },
    ...statuses
      .filter((s) => s.slug === current || !counts || (counts[s.slug] ?? 0) > 0)
      .map((s) => ({ slug: s.slug, label: statusMeta(s.slug, s.name).label, count: counts?.[s.slug] })),
  ];

  return (
    <nav aria-label="Order status" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 border-b border-hairline">
        {tabs.map((tab) => {
          const active = tab.slug === current;
          return (
            <li key={tab.slug}>
              <Link
                href={hrefWith("/admin/orders", { ...params, status: tab.slug === "all" ? undefined : tab.slug, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-[14px] font-medium whitespace-nowrap transition-colors",
                  active ? "border-green text-ink" : "border-transparent text-ink-muted hover:text-ink"
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      "data-num rounded-full px-1.5 text-[12px] leading-5",
                      active ? "bg-[color-mix(in_oklab,var(--green)_12%,white)] text-green" : "bg-secondary text-ink-muted"
                    )}
                  >
                    {formatCount(tab.count)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
