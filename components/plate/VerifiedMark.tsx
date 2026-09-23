/**
 * VerifiedMark — the EARNED verified treatment (D3 trust graft #2).
 *
 * Renders ONLY where a real third-party COA PDF exists. Its absence is
 * meaningful — never render it for a product without a `coaUrl`. Reusable on
 * specimen plates, the PDP spec area, and cart line items. ok-green per the
 * learned-color rule (never amber).
 *
 * Server-safe (no client JS). `label={false}` gives the compact dot-only form
 * for dense contexts (cart line items); the default shows the live site's
 * "3rd Party Tested" badge title.
 */
import { cn } from "@/lib/utils";
import { trustBadges } from "@/content/site-copy";

/** "3rd Party Tested" — the live homepage trust badge title. */
const THIRD_PARTY_TESTED =
  trustBadges.find((b) => b.title.startsWith("3rd Party"))?.title ??
  "3rd Party Tested";

export function VerifiedMark({
  label = THIRD_PARTY_TESTED,
  className,
}: {
  /** Text to show after the check; pass false for the dot-only compact form. */
  label?: string | false;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-ok",
        label !== false &&
          "micro-label !text-ok !tracking-[0.1em]",
        className
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="6.4" />
        <path d="M5.4 8.1 7.1 9.8 10.7 6.2" />
      </svg>
      {label !== false ? (
        <span>{label}</span>
      ) : (
        <span className="sr-only">{THIRD_PARTY_TESTED}</span>
      )}
    </span>
  );
}
