/**
 * Compliance boilerplate — research-use-only (RUO) framing for Primetime
 * Research. Pull these strings verbatim into banners, PDPs, and the footer.
 * RUO framing is a first-class trust element of this site, not fine print.
 */

export const compliance = {
  /**
   * Primary RUO banner — prominent placement (top-of-site strip, PDP,
   * cart/checkout). Verbatim per spec.
   */
  ruoBanner: "FOR RESEARCH USE ONLY. Not for human or veterinary use.",

  /** FDA disclaimer — required on home and product pages. */
  fdaDisclaimer:
    "These statements have not been evaluated by the Food and Drug Administration. " +
    "These products are not intended to diagnose, treat, cure, or prevent any disease.",

  /** Condensed footer line. */
  footerNote:
    "All products sold by Primetime Research are intended for laboratory research use only. " +
    "Not for human or veterinary use. Not evaluated by the FDA. " +
    "Not intended to diagnose, treat, cure, or prevent any disease.",
} as const;

export type Compliance = typeof compliance;
