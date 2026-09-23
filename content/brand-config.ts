/**
 * Primetime Research brand configuration — the single source of truth for
 * brand values. Engine, sections, and layout read from this object.
 *
 * Design system: D3 "Reference Grade" — navy-and-white printed reference
 * catalog with poster-scale Satoshi numerals and duotoned specimen
 * plates. Palette matches the client's live ptresearch.shop brand (navy blue +
 * white, small orange accent). See DESIGN.md at repo root for the full spec.
 */

export const brandConfig = {
  /** Brand name — used in titles, headings, wordmarks */
  name: "Primetime Research",

  /** Live store domain (source of product imagery + canonical copy) */
  domain: "ptresearch.shop",

  /** Verbatim client tagline (live homepage brand block, 2026-09-17) */
  tagline: "Empowering Ideas Through Research",

  /** Verbatim client hero copy — do not rewrite */
  hero: {
    headline: "Premium-Grade Peptides",
    subhead:
      "At Primetime Research, we’re committed to providing researchers with the highest quality peptides and peptide blends in the industry.",
  },

  /**
   * D3 "Reference Grade" palette.
   *
   * ⚠️ SINGLE SOURCE OF TRUTH for color. The CSS tokens in app/globals.css are
   * GENERATED from this object by scripts/gen-theme.mjs (runs on `prebuild`;
   * run `npm run gen:theme` after editing). Never hand-edit the generated
   * block in globals.css.
   *
   * Color logic: paper is the ground; NAVY is the brand — the darker band navy
   * (`band` #1F3353) carries the chapter-band backgrounds, and the brighter
   * brand navy (`green` #2C4D82, the live site's primary) carries ALL
   * interactive/link/data emphasis on light. `amber` (now ORANGE #F06D22, the
   * live site's accent) is the single signal color, reserved for large display
   * + non-text marks on navy bands only (it fails text contrast on paper by
   * design, so it can never be misused as a link). `accent`/`accentInk` are
   * kept as aliases of green/green-deep so the pre-existing shadcn + component
   * call sites (text-accent, bg-accent) stay on-palette.
   *
   * NOTE ON KEY NAMES: `green`, `greenDeep`, `mint`, `amber` are LEGACY key
   * names (≈150 utility call sites: bg-green, text-mint, …) — their VALUES are
   * now navy / deep navy / mist blue / orange. Renaming the keys would be a
   * structural churn across every component; the names stay, the roles hold.
   */
  palette: {
    /** Cool near-white page base — the printed-catalog ground */
    paper: "#F7F8FA",
    /** Alias of paper — legacy `bg-bg`/theme-color call sites read this */
    bg: "#F7F8FA",
    /** Plates/cards — pure white, one step brighter than paper */
    surface: "#FFFFFF",
    /** Primary text — cool near-black */
    ink: "#10151D",
    /** Secondary text, records, micro-labels — 6.9:1 on paper */
    inkMuted: "#4E5765",
    /** 1px rules + plate frames — cool */
    hairline: "#DCE1E9",
    /** Chapter-band bg — the darker band navy (11.9:1 vs paper) */
    band: "#1F3353",
    /** Brand navy: buttons, links, all interactive/data emphasis — 7.9:1 on paper */
    green: "#2C4D82",
    /** Hover/pressed (also the age-gate deep-navy field) */
    greenDeep: "#182438",
    /** Body text + secondary UI on navy bands — mist blue, 8.5:1 on band */
    mint: "#C7D4E8",
    /** Signal ORANGE: large display numerals on navy bands, crop-mark ticks — large/graphic ONLY (4.2:1 on band) */
    amber: "#F06D22",
    /** Interactive/data on light — alias of green (legacy text-accent/bg-accent) */
    accent: "#2C4D82",
    /** Hover/pressed — alias of green-deep (legacy accent-ink) */
    accentInk: "#182438",
    /** In-stock dot + earned verified mark — cool green, 5.0:1 on paper */
    ok: "#1E7A4A",
    /** Faint orange wash behind RUO/compliance lines (ink text on top) */
    warnWash: "#FDEEE2",
    /** Cool brick red — form errors, decline — 5.8:1 on paper */
    error: "#B3341C",

    /* 2026-09 CRO redesign — the homepage + site chrome (header, research
       bar, footer) from the Claude Design file "Primetime Research.dc.html".
       Scoped to those surfaces; the tokens above still drive every other
       page. See DESIGN.md §0. */
    /** Page ground behind the redesigned homepage */
    mist: "#F4F7FB",
    /** Headings + primary text on light */
    navyInk: "#0B1B33",
    /** Hero + closing CTA band ground */
    midnight: "#061428",
    /** Structural navy — research bar, cart button, badges, COA button */
    navy: "#1E3A6E",
    /** Primary action blue — CTAs, links, kickers — 7.0:1 on white */
    cobalt: "#1E5AA8",
    /** Hover for cobalt */
    cobaltBright: "#2B6FCC",
    /** Highlight type on midnight */
    azure: "#7FB3FF",
    /** Card + section borders */
    rule: "#E1E8F2",
    /** Secondary text, struck-through prices — 5.4:1 on white */
    steel: "#5A6B85",
    /** Body copy on light */
    steelInk: "#41506A",
    /** Vial field behind product photographs */
    frost: "#F7FAFD",
    /** Footer ground */
    ice: "#EAF3FB",
    /** Footer rules */
    iceRule: "#D6E3F1",
    /** Labels + sublines on midnight */
    haze: "#9FB3D1",
    /** Hero body copy on midnight */
    hazeLight: "#C9D6EA",
    /** Hero pill text on midnight */
    hazePale: "#BFD4F5",
  },

  /**
   * CSS custom property names (set on <html> by next/font/local in
   * layout.tsx). ONE self-hosted face (owner directive, Matt 2026-07):
   * Satoshi Variable (ITF Free Font License via Fontshare) for display, body,
   * UI, and data — Fraunces + General Sans are retired. Data/numerics are
   * Satoshi 500 with `tabular-nums lining-nums`, never a code font; every
   * role resolves to --font-satoshi so no utility can resurrect another face.
   */
  fontVars: {
    display: "--font-satoshi",
    body: "--font-satoshi",
    data: "--font-satoshi",
  },

  /**
   * Live promos — verbatim from the live site (2026-09-17). Cart math
   * constants live here so the LocalStorage cart adapter and promo UI read the
   * same values. Prices/amounts are integer minor units (cents).
   *
   * - coupon: the "LIMITED OFFER" banner at the top of every live page except
   *   the homepage ("USE CODE: PT25" / "25% off all Research Compounds").
   * - freeShipping + shippingSpeed: the homepage strip, rendered live as
   *   "2-Day Shipping | Free Shipping $200+".
   * The "Buy One Get One 50% Off" banner is hidden on the live site and the
   * live cart no longer applies it, so it is not offered here.
   */
  promos: {
    coupon: {
      code: "PT25",
      percentOff: 25,
      badge: "LIMITED OFFER",
      codeLabel: "USE CODE:",
      detail: "25% off all Research Compounds",
      cta: "Shop Now",
    },
    freeShipping: {
      thresholdMinor: 20000,
      label: "Free Shipping $200+",
    },
    shippingSpeed: {
      label: "2-Day Shipping",
    },
  },
} as const;

export type BrandConfig = typeof brandConfig;
