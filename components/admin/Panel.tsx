import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled soft card — the admin panel's basic content container. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("soft-card min-w-0", className)} aria-labelledby={id && title ? `${id}-title` : undefined}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-hairline/70 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 id={id ? `${id}-title` : undefined} className="text-[15px] leading-snug font-semibold tracking-[-0.01em] text-ink">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Label/value rows for record details (payment, customer, config). */
export function DetailList({ rows }: { rows: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          <dt className="micro-label">{row.label}</dt>
          <dd className="min-w-0 break-words text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
