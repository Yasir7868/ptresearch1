/**
 * Hero — the homepage's opening band: the owner's product film full-bleed
 * behind the copy, then the "Trusted by researchers worldwide" pill, the
 * serif headline with its azure second line, the live hero body, two CTAs,
 * and the four stats over a hairline.
 *
 * MOBILE HEIGHT IS THE CONSTRAINT (owner request 2026-09-27): the band is
 * capped at 75svh on phones — three quarters of the screen, and `svh` rather
 * than `vh` so the mobile browser's collapsing toolbar cannot change it —
 * with every step of the copy scaled to land inside that. It is `min-h`, not
 * `h`: on a short phone the copy still wins and the band grows rather than
 * clipping the stats.
 *
 * The three floating vial cut-outs were retired here (same request): the film
 * already turns a branded vial, and two vials in one corner is what the
 * height was going to. The cut-outs stay in public/images/home/.
 *
 * Copy: heroCopy (live) + redesignHome.hero (the design's headline line and
 * stat labels). The live body keeps its research-use-only sentence.
 * Server component; HeroVideo is its one client leaf.
 */

import Link from "next/link";
import { heroCopy, redesignHome } from "@/content/site-copy";
import { HeroVideo } from "./HeroVideo";
import { Arrow, CONTAINER, PRIMARY_CTA, SERIF } from "./parts";
import { cn } from "@/lib/utils";

const { hero } = redesignHome;

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[75svh] items-center overflow-hidden bg-midnight text-white lg:min-h-[660px]">
      <HeroVideo className="absolute inset-0 -z-10 size-full object-cover" />

      {/* Two passes over the film. The wash darkens it everywhere (the
          portrait cut brightens as it pushes in, and white type has to hold
          against that); the second pass is a one-sided fade that keeps the
          left column near-solid on wide screens while the vial and molecule
          stay visible on the right. On phones the copy sits over the whole
          frame, so that fade runs bottom-to-top instead. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-midnight/28 md:bg-midnight/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-midnight)_3%,rgba(6,20,40,0.58)_38%,rgba(6,20,40,0.04)_100%)] md:bg-[linear-gradient(to_right,var(--color-midnight)_6%,rgba(6,20,40,0.78)_40%,rgba(6,20,40,0.06)_85%)]"
      />

      <div className={cn(CONTAINER, "relative py-10 md:py-14 lg:py-16")}>
        <div className="max-w-[640px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-haze-pale uppercase sm:px-3.5 sm:py-1.5 sm:text-[12px]">
            {heroCopy.trustHeading}
          </p>

          <h1
            className={cn(
              SERIF,
              "mt-4 mb-3 text-[clamp(30px,5.5vw,64px)] leading-[1.05] tracking-[-0.02em] text-pretty text-white sm:mt-5 sm:mb-[18px]",
            )}
          >
            {hero.heading}
            <br />
            <span className="text-azure">{hero.emphasis}</span>
          </h1>

          <p className="mb-5 text-[15px] leading-[1.55] text-pretty text-haze-light sm:mb-7 sm:text-[17px] sm:leading-[1.6]">
            {heroCopy.body}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/catalog" className={PRIMARY_CTA}>
              {heroCopy.cta} <Arrow />
            </Link>
            <Link
              href="#coa"
              className="inline-flex h-[52px] items-center gap-2.5 rounded-[12px] border border-white/35 px-5 text-[15px] font-bold text-white transition-colors hover:bg-white/8 hover:text-white sm:px-[22px] sm:text-[16px]"
            >
              {heroCopy.trustCta}
            </Link>
          </div>

          {/* Phones show the headline, body and CTAs only (owner request
              2026-09-27) — the stats return at md, where the band is no
              longer height-capped. */}
          <dl className="mt-6 hidden flex-wrap gap-x-8 gap-y-4 border-t border-white/14 pt-5 md:flex md:gap-y-6 md:pt-6 lg:mt-9">
            {hero.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse">
                <dt className="text-[12px] text-haze sm:text-[13px]">
                  {stat.label}
                </dt>
                <dd className="text-[21px] font-extrabold sm:text-[26px]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
