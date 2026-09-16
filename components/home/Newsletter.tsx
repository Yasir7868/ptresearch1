/**
 * Newsletter — the deep-green CLOSING band (DESIGN §7.12): the verbatim
 * newsletter block on green, flowing straight into the green footer for one
 * continuous closing movement. Enters with the InkWipe flood.
 *
 * Capture is VISUAL ONLY — input + button are disabled with a "Coming online
 * at launch" note (no handler, no network) so the prototype never implies a
 * working list. Copy verbatim from content/site-copy.ts.
 */

import { newsletter } from "@/content/site-copy";
import { InkWipe } from "@/components/motion/InkWipe";

export function Newsletter() {
  return (
    <InkWipe>
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center md:px-6 md:py-24">
        <p className="micro-label-dark">Newsletter</p>
        <h2 className="mt-4 text-[clamp(1.7rem,2.8vw,2.4rem)]">
          {newsletter.heading}
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed">
          {newsletter.body}
        </p>

        <div className="mt-9 flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            inputMode="email"
            placeholder="you@lab.org"
            aria-label="Email address"
            disabled
            className="h-11 flex-1 rounded-lg border border-mint/30 bg-surface px-4 text-[15px] text-ink placeholder:text-ink-muted disabled:opacity-90"
          />
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-surface px-7 text-sm font-[540] tracking-[0.01em] text-green opacity-70"
          >
            Subscribe
          </button>
        </div>

        <p className="micro-label-dark mt-4">Coming online at launch</p>
      </div>
    </InkWipe>
  );
}
