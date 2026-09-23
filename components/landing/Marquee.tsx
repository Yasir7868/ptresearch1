/**
 * Marquee — the live site's "PEPTIDES FOR RESEARCH ◦" line, set as outlined
 * display type and scrolling left. It replaces the category grid that sat
 * between the trust strip and the best sellers (owner request 2026-09-24).
 *
 * The track renders the sequence twice and slides exactly half its width
 * (.marquee-track, globals.css), so the loop is seamless without JS. Under
 * prefers-reduced-motion it stops and reads as a static line (DESIGN §6).
 *
 * Copy: `marquee` in content/site-copy.ts, verbatim live. The whole band is
 * decorative repetition of a line the page already states, so it is hidden
 * from assistive tech rather than read out four times.
 *
 * Server component.
 */

import { marquee } from "@/content/site-copy";

/**
 * Repeats per half. Each half must be at least as wide as the viewport or the
 * loop shows a gap: at the smallest clamp size one phrase is ~480px, so three
 * covers phones, and at the largest it is ~1100px, covering 3300px — wider
 * than any common desktop.
 */
const REPEATS = 3;

/** The ring between phrases — a drawn circle, not a glyph the font may lack. */
function Dot() {
  return (
    <span className="size-2.5 shrink-0 rounded-full border-2 border-navy sm:size-3" />
  );
}

function Sequence() {
  return (
    <>
      {Array.from({ length: REPEATS }, (_, i) => (
        // The spacing is the item's own padding, never a flex gap on the
        // track: a gap sits BETWEEN items, so half the track would be half a
        // gap short of the loop point and the line would jump each cycle.
        <div
          key={i}
          className="flex shrink-0 items-center gap-6 pr-6 sm:gap-10 sm:pr-10"
        >
          <span className="marquee-outline text-[clamp(44px,9vw,104px)] leading-[1.1] font-extrabold tracking-[0.01em] whitespace-nowrap uppercase">
            {marquee}
          </span>
          <Dot />
        </div>
      ))}
    </>
  );
}

export function Marquee() {
  return (
    <section
      aria-hidden="true"
      className="overflow-hidden border-b border-rule bg-white py-6 sm:py-8"
    >
      <div className="marquee-track flex w-max items-center">
        <Sequence />
        <Sequence />
      </div>
    </section>
  );
}
