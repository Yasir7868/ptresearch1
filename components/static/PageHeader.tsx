/**
 * PageHeader — the shared opening pattern for every supporting page, restyled
 * for D3 "Reference Grade": a Satoshi micro-label kicker, a bold Satoshi
 * display title, and an optional Satoshi lead.
 *
 * Server component. Entrance motion comes from the FadeIn client leaves
 * (fade + rise, staggered) — calm and editorial per DESIGN §6.
 */
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

export function PageHeader({
  label,
  title,
  sub,
  className,
}: {
  label: string;
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <FadeInStagger className={cn("max-w-3xl", className)}>
      <FadeIn>
        <p className="micro-label">{label}</p>
      </FadeIn>
      <FadeIn>
        <h1 className="display-hero mt-5 text-[clamp(2.5rem,5.5vw,4rem)] text-ink">
          {title}
        </h1>
      </FadeIn>
      {sub ? (
        <FadeIn>
          <p className="mt-5 text-[17px] leading-[1.55] text-ink-muted md:text-[19px]">
            {sub}
          </p>
        </FadeIn>
      ) : null}
    </FadeInStagger>
  );
}
