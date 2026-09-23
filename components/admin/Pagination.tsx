import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCount } from "@/lib/admin/money";
import { cn } from "@/lib/utils";

type Params = Record<string, string | number | undefined | null>;

/** Build an admin URL, dropping empty params and page=1. */
export function hrefWith(path: string, params: Params): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    query.set(key, String(value));
  }
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
}

export function Pagination({
  path,
  params,
  page,
  perPage,
  total,
  totalPages,
  noun = "results",
}: {
  path: string;
  params: Params;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  noun?: string;
}) {
  if (total === 0) return null;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const linkClass =
    "inline-flex h-8 items-center gap-1 rounded-lg border border-hairline bg-surface px-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted";
  const disabledClass = "pointer-events-none opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-hairline/70 px-5 py-3 sm:flex-row"
    >
      <p className="text-[13px] text-ink-muted">
        <span className="data-num text-ink">{formatCount(first)}</span>–
        <span className="data-num text-ink">{formatCount(last)}</span> of{" "}
        <span className="data-num text-ink">{formatCount(total)}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefWith(path, { ...params, page: page - 1 })}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(linkClass, page <= 1 && disabledClass)}
        >
          <ChevronLeft aria-hidden="true" className="size-4" /> Previous
        </Link>
        <span className="data-num px-1 text-[13px] text-ink-muted">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Link
          href={hrefWith(path, { ...params, page: page + 1 })}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={cn(linkClass, page >= totalPages && disabledClass)}
        >
          Next <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
