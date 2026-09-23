/**
 * Hero — midnight band with the molecule render bleeding in from the right
 * (masked to transparent on its left edge), the "Trusted by researchers
 * worldwide" pill, the serif headline with its azure second line, the live
 * hero body, two CTAs, and the four stats over a hairline.
 *
 * Right of the copy, three cut-out vials float over the molecule: GHK-Cu
 * tallest in the middle, 5-Amino 1MQ and GLP3-RT smaller and overlapped
 * behind it, each drifting on its own cycle (`.vial-float`, globals.css;
 * still under prefers-reduced-motion). Below lg the cluster moves under the
 * copy at a smaller size.
 *
 * Copy: heroCopy (live) + redesignHome.hero (the design's headline line and
 * stat labels). The live body keeps its research-use-only sentence.
 * Server component.
 */

import Image from "next/image";
import Link from "next/link";
import { heroCopy, redesignHome } from "@/content/site-copy";
import { Arrow, CONTAINER, PRIMARY_CTA, SERIF } from "./parts";
import { cn } from "@/lib/utils";

const { hero } = redesignHome;

// Fades the render in from its left edge so it sits behind the copy.
const MOLECULE_MASK = "linear-gradient(90deg, transparent, black 40%)";

/**
 * The cluster, outside in: the middle vial stands clear of the other two,
 * which are shorter and set apart rather than overlapped. Bases align, so the
 * three read as one group, each hovering over its own pool of light.
 *
 * The cut-outs are 960px tall, so every size here is served well inside the
 * source resolution. Widths are what decide whether the cluster fits beside
 * the copy (max-w-640 + gap inside a 1192px row), hence the step at xl.
 */
const VIALS = [
  {
    src: "/images/home/vial-5-amino-1mq.webp",
    alt: "Primetime Research 5-Amino 1MQ 5mg research vial",
    width: 405,
    height: 960,
    className: "vial-float-2 h-[195px] sm:h-[235px] lg:h-[245px] xl:h-[300px]",
  },
  {
    src: "/images/home/vial-ghk-cu.webp",
    alt: "Primetime Research GHK-Cu 100mg research vial",
    width: 406,
    height: 960,
    className: "h-[280px] sm:h-[340px] lg:h-[350px] xl:h-[440px]",
  },
  {
    src: "/images/home/vial-glp3-rt.webp",
    alt: "Primetime Research GLP3-RT 10mg research vial",
    width: 408,
    height: 960,
    className: "vial-float-3 h-[195px] sm:h-[235px] lg:h-[245px] xl:h-[300px]",
  },
] as const;

function VialCluster() {
  return (
    <div className="relative shrink-0 self-center">
      {/* Cool light behind the glass so the cut-outs lift off the midnight. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-12%] top-[8%] bottom-[-6%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(127,179,255,0.22),rgba(127,179,255,0.06)_45%,transparent_72%)] blur-xl"
      />
      <div className="relative flex items-end justify-center gap-3 sm:gap-4 xl:gap-6">
        {VIALS.map((vial) => (
          <div key={vial.src} className="flex flex-col items-center">
            <Image
              src={vial.src}
              alt={vial.alt}
              width={vial.width}
              height={vial.height}
              sizes="(min-width: 1280px) 190px, (min-width: 640px) 150px, 120px"
              loading="eager"
              className={cn(
                "vial-float w-auto drop-shadow-[0_26px_30px_rgba(2,8,20,0.6)]",
                vial.className,
              )}
            />
            {/* Pool of light the vial hovers over — it stays put while the
                vial drifts, which is what sells the hover. */}
            <span
              aria-hidden="true"
              className="mt-2 h-4 w-[86%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(150,196,255,0.42),rgba(127,179,255,0.14)_45%,transparent_72%)] blur-[6px] sm:h-5 xl:h-6"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-midnight text-white">
      <Image
        src="/images/home/molecule.webp"
        alt=""
        aria-hidden="true"
        width={820}
        height={780}
        loading="eager"
        sizes="(min-width: 768px) 720px, 100vw"
        // Behind the text on narrow screens, so it steps back there.
        className="pointer-events-none absolute top-0 -right-[60px] h-full w-auto max-w-none opacity-35 select-none md:opacity-75"
        style={{ maskImage: MOLECULE_MASK, WebkitMaskImage: MOLECULE_MASK }}
      />

      <div className={cn(CONTAINER, "relative pt-16 pb-14")}>
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="max-w-[640px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.14em] text-haze-pale uppercase">
              {heroCopy.trustHeading}
            </p>

            <h1
              className={cn(
                SERIF,
                "mt-5 mb-[18px] text-[clamp(38px,5.5vw,64px)] leading-[1.05] tracking-[-0.02em] text-pretty text-white",
              )}
            >
              {hero.heading}
              <br />
              <span className="text-azure">{hero.emphasis}</span>
            </h1>

            <p className="mb-7 text-[17px] leading-[1.6] text-pretty text-haze-light">
              {heroCopy.body}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className={PRIMARY_CTA}>
                {heroCopy.cta} <Arrow />
              </Link>
              <Link
                href="#coa"
                className="inline-flex h-[52px] items-center gap-2.5 rounded-[12px] border border-white/35 px-[22px] text-[16px] font-bold text-white transition-colors hover:bg-white/8 hover:text-white"
              >
                {heroCopy.trustCta}
              </Link>
            </div>

            <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-6 border-t border-white/14 pt-6">
              {hero.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse">
                  <dt className="text-[13px] text-haze">{stat.label}</dt>
                  <dd className="text-[26px] font-extrabold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <VialCluster />
        </div>
      </div>
    </section>
  );
}
