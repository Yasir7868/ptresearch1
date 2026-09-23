import { statusMeta, type StatusTone } from "@/lib/admin/order-status";
import { cn } from "@/lib/utils";

/* Tints are mixed from the brand tokens; every pair clears WCAG AA (4.5:1). */
const TONES: Record<StatusTone, string> = {
  success:
    "bg-[color-mix(in_oklab,var(--ok)_13%,white)] text-[color-mix(in_oklab,var(--ok)_88%,black)]",
  info: "bg-[color-mix(in_oklab,var(--green)_11%,white)] text-green",
  warning: "bg-warn-wash text-[color-mix(in_oklab,var(--amber)_50%,var(--ink))]",
  danger: "bg-[color-mix(in_oklab,var(--error)_11%,white)] text-error",
  neutral: "bg-secondary text-ink-muted",
  muted: "border border-hairline bg-surface text-ink-muted",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const meta = statusMeta(status, label);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] leading-5 font-medium whitespace-nowrap",
        TONES[meta.tone],
        className
      )}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] leading-5 font-medium whitespace-nowrap",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
