"use client";

/**
 * LocalTime — a timestamp in the VIEWER's own timezone.
 *
 * The server can't know the viewer's timezone, so the first render (server +
 * hydration) prints the date in UTC, then the client swaps in local time.
 * useSyncExternalStore makes that swap hydration-safe (no mismatch warning).
 */

import { useSyncExternalStore } from "react";

type Format = "relative" | "date" | "datetime" | "time";

const subscribe = () => () => {};

function absolute(date: Date, format: Format, timeZone?: string): string {
  const options: Intl.DateTimeFormatOptions =
    format === "date"
      ? { month: "short", day: "numeric", year: "numeric" }
      : format === "time"
        ? { hour: "numeric", minute: "2-digit" }
        : { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" };
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(date);
}

export function relative(date: Date, now = Date.now()): string {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (abs < 45) return "just now";
  if (abs < 45 * 60) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 22 * 3600) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86400) return rtf.format(Math.round(seconds / 86400), "day");
  return absolute(date, "date");
}

export function LocalTime({
  value,
  format = "datetime",
  className,
}: {
  value: string | number | null | undefined;
  format?: Format;
  className?: string;
}) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (value === null || value === undefined || value === "") return <span className={className}>—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>—</span>;

  const full = hydrated ? absolute(date, "datetime") : `${absolute(date, "datetime", "UTC")} UTC`;
  const text =
    format === "relative"
      ? hydrated
        ? relative(date)
        : absolute(date, "date", "UTC")
      : hydrated
        ? absolute(date, format)
        : absolute(date, format, "UTC");

  return (
    <time dateTime={date.toISOString()} title={full} className={className}>
      {text}
    </time>
  );
}
