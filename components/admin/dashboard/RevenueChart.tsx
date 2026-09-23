"use client";

/**
 * RevenueChart — revenue per day as thin columns (one series, brand navy).
 *
 * Dataviz contract: columns <= 24px with a 4px rounded top on a hairline
 * baseline; solid hairline gridlines at clean tick values; only the highest
 * day is labelled directly; every column has a hover/focus tooltip (value
 * first, then the day and order count); arrow keys move between days; and a
 * table view carries every value without hovering. For "Today" the last day
 * is emphasized and the six before it are context.
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatCount, formatMoney, formatMoneyCompact } from "@/lib/admin/money";
import { cn } from "@/lib/utils";

export interface ChartDay {
  date: string;
  salesMinor: number;
  orders: number;
}

const PLOT_HEIGHT = 200;
const AXIS_BAND = 28;
const TOP_PAD = 22;
const LEFT_AXIS = 56;

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const fraction = value / exponent;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return step * exponent;
}

function dayLabel(date: string, style: "short" | "weekday" | "long"): string {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, d!));
  const options: Intl.DateTimeFormatOptions =
    style === "weekday"
      ? { weekday: "short", timeZone: "UTC" }
      : style === "short"
        ? { month: "short", day: "numeric", timeZone: "UTC" }
        : { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-US", options).format(utc);
}

/** Rounded-top column path; square at the baseline. */
function columnPath(x: number, y: number, width: number, height: number): string {
  const r = Math.min(4, width / 2, height);
  if (height <= 0) return "";
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    "Z",
  ].join(" ");
}

export function RevenueChart({
  days,
  currency,
  emphasizeLast,
  title,
}: {
  days: ChartDay[];
  currency: string;
  emphasizeLast: boolean;
  title: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(0, ...days.map((d) => d.salesMinor));
  const top = niceMax(max / 100) * 100;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(top * t));
  const plotWidth = width - LEFT_AXIS;
  const band = plotWidth / Math.max(days.length, 1);
  const barWidth = Math.max(4, Math.min(24, band - 2 - band * 0.35));
  const y = (value: number) => TOP_PAD + PLOT_HEIGHT - (value / top) * PLOT_HEIGHT;
  const maxIndex = max > 0 ? days.findIndex((d) => d.salesMinor === max) : -1;
  const labelEvery = Math.ceil(days.length / Math.max(1, Math.floor(plotWidth / 64)));
  const empty = max === 0;
  const activeDay = active !== null ? days[active] : null;

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActive((current) => {
        const start = current ?? (event.key === "ArrowRight" ? -1 : days.length);
        return Math.min(days.length - 1, Math.max(0, start + (event.key === "ArrowRight" ? 1 : -1)));
      });
    } else if (event.key === "Escape") {
      setActive(null);
    }
  };

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-ink">{title}</span>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-expanded={showTable}
          className="text-[13px] font-medium text-green underline-offset-4 hover:underline"
        >
          {showTable ? "Show chart" : "Show as table"}
        </button>
      </figcaption>

      {showTable ? (
        <div className="mt-3 max-h-[260px] overflow-y-auto rounded-xl border border-hairline">
          <table className="ledger-table">
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col" className="num">Revenue</th>
                <th scope="col" className="num">Orders</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <td>{dayLabel(d.date, "long")}</td>
                  <td className="num">{formatMoney(d.salesMinor, currency)}</td>
                  <td className="num">{formatCount(d.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative mt-3">
          <svg
            width={width}
            height={TOP_PAD + PLOT_HEIGHT + AXIS_BAND}
            role="img"
            aria-label={`${title}. Use the left and right arrow keys to read each day, or show as table.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onBlur={() => setActive(null)}
            onMouseLeave={() => setActive(null)}
            className="block max-w-full overflow-visible rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green"
          >
            {ticks.map((tick) => (
              <g key={tick}>
                <line x1={LEFT_AXIS} x2={width} y1={y(tick)} y2={y(tick)} stroke="var(--hairline)" strokeWidth={1} shapeRendering="crispEdges" />
                <text x={LEFT_AXIS - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px] tabular-nums">
                  {formatMoneyCompact(tick, currency)}
                </text>
              </g>
            ))}

            {days.map((d, i) => {
              const x = LEFT_AXIS + i * band + (band - barWidth) / 2;
              const height = (d.salesMinor / top) * PLOT_HEIGHT;
              const isLast = i === days.length - 1;
              const context = emphasizeLast && !isLast;
              const hovered = active === i;
              return (
                <g key={d.date}>
                  <path
                    d={columnPath(x, y(d.salesMinor), barWidth, height)}
                    fill={
                      hovered
                        ? "var(--green-deep)"
                        : context
                          ? "color-mix(in oklab, var(--green) 32%, white)"
                          : "var(--green)"
                    }
                  />
                  {i === maxIndex && !hovered && (
                    <text x={x + barWidth / 2} y={y(d.salesMinor) - 7} textAnchor="middle" className="fill-ink text-[11px] font-medium tabular-nums">
                      {formatMoneyCompact(d.salesMinor, currency)}
                    </text>
                  )}
                  {(i % labelEvery === 0 || isLast) && (
                    <text
                      x={LEFT_AXIS + i * band + band / 2}
                      y={TOP_PAD + PLOT_HEIGHT + 18}
                      textAnchor="middle"
                      className={cn("text-[11px]", isLast ? "fill-ink font-medium" : "fill-ink-muted")}
                    >
                      {dayLabel(d.date, days.length <= 7 ? "weekday" : "short")}
                    </text>
                  )}
                  {/* Hit target: the whole column band, not just the painted bar. */}
                  <rect
                    x={LEFT_AXIS + i * band}
                    y={TOP_PAD}
                    width={band}
                    height={PLOT_HEIGHT}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                    onMouseMove={() => setActive(i)}
                  />
                </g>
              );
            })}

            <line
              x1={LEFT_AXIS}
              x2={width}
              y1={TOP_PAD + PLOT_HEIGHT}
              y2={TOP_PAD + PLOT_HEIGHT}
              stroke="color-mix(in oklab, var(--ink) 30%, white)"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          </svg>

          {activeDay && active !== null && (
            <div
              role="status"
              className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-surface px-3 py-2 text-left shadow-md ring-1 ring-foreground/10"
              style={{
                left: Math.min(width - 90, Math.max(90, LEFT_AXIS + active * band + band / 2)),
                top: Math.max(0, y(activeDay.salesMinor) - 64),
              }}
            >
              <p className="text-[15px] font-semibold text-ink">{formatMoney(activeDay.salesMinor, currency)}</p>
              <p className="text-[12px] text-ink-muted">
                {dayLabel(activeDay.date, "long")} · {formatCount(activeDay.orders)} order{activeDay.orders === 1 ? "" : "s"}
              </p>
            </div>
          )}

          {empty && (
            <p className="absolute inset-x-0 top-[40%] text-center text-sm text-ink-muted">No sales in this period yet.</p>
          )}
        </div>
      )}
    </figure>
  );
}
