/**
 * Compliance lines — research-use-only (RUO) framing for Primetime Research,
 * VERBATIM from the live site (re-harvested 2026-09-17). RUO framing is a
 * first-class trust element of this site, not fine print. The live site
 * carries no FDA disclaimer, so none is defined here.
 */

export const compliance = {
  /** Top strip of the live homepage. */
  ruoStrip: "FOR RESEARCH USE ONLY",

  /** Footer, every page. No closing period on the live site. */
  footerNote:
    "All products are sold for research, laboratory, or analytical purposes only, and are not for human consumption",

  /** Closing line of the live age-gate popup. */
  ageGateDisclaimer:
    "All products available on Primetime Research are strictly intended for laboratory research use only. " +
    "They are not for human consumption, medical treatment, or veterinary use.",

  /** Last paragraph of the WooCommerce short description on live products. */
  productRuoLine:
    "For research use only. Not for human or veterinary consumption. " +
    "Not intended for diagnosis, treatment, cure, or prevention of any disease.",
} as const;

export type Compliance = typeof compliance;
