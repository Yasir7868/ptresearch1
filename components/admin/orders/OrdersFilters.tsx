"use client";

/**
 * Search + date filters for the orders list. A GET form (next/form): it
 * navigates client-side, keeps the URL shareable, and works without JS.
 * Typing pauses briefly before searching; selects apply immediately.
 */

import Form from "next/form";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const DATE_PRESETS = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "custom", label: "Custom range" },
] as const;

const selectClass =
  "h-9 rounded-lg border border-input bg-surface px-2.5 pr-8 text-sm text-ink outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function OrdersFilters({
  status,
  q,
  range,
  from,
  to,
  perPage,
}: {
  status: string;
  q: string;
  range: string;
  from: string;
  to: string;
  perPage: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const submit = () => formRef.current?.requestSubmit();
  const filtered = Boolean(q || range);

  return (
    <Form ref={formRef} action="/admin/orders" replace scroll={false} className="flex flex-wrap items-end gap-2">
      {status !== "all" && <input type="hidden" name="status" value={status} />}
      {perPage !== 20 && <input type="hidden" name="per_page" value={perPage} />}

      <div className="relative min-w-[220px] flex-1 md:max-w-sm">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-muted" />
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Order number, name or email"
          aria-label="Search orders"
          className="h-9 bg-surface pl-8"
          onChange={() => {
            clearTimeout(timer.current);
            timer.current = setTimeout(submit, 500);
          }}
        />
      </div>

      <select name="range" defaultValue={range} aria-label="Date" onChange={submit} className={selectClass}>
        {DATE_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {range === "custom" && (
        <>
          <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
            From
            <input type="date" name="from" defaultValue={from} onChange={submit} className={selectClass} />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-ink-muted">
            To
            <input type="date" name="to" defaultValue={to} onChange={submit} className={selectClass} />
          </label>
        </>
      )}

      <Button type="submit" variant="outline" className="h-9 px-3 max-md:hidden">
        Search
      </Button>
      {filtered && (
        <Button asChild variant="ghost" className="h-9 px-2.5 text-ink-muted">
          <Link href={status === "all" ? "/admin/orders" : `/admin/orders?status=${status}`} scroll={false}>
            <X aria-hidden="true" /> Clear
          </Link>
        </Button>
      )}
    </Form>
  );
}
