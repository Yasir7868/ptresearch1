/**
 * Bulk / wholesale ordering — tier ladder and copy.
 *
 * This page has no live ptresearch.shop counterpart, so its copy is written
 * here rather than harvested (PRODUCT.md "Verbatim client copy" covers pages
 * that exist live). Components still read every string from this file.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * THE MODEL — PER PRODUCT, NOT PER ORDER (owner directive 2026-09-25,
 * from the reference bulk page).
 *
 * A minimum of `bulkMinUnits` units of ONE product earns that product its
 * discount. Units are counted across that product's strengths, so 5 x 10mg
 * plus 5 x 30mg of the same compound is 10 units of it and qualifies; the
 * buyer mixes strengths freely. Each product earns its own tier
 * independently — a 50-unit product gets the top tier while a 10-unit product
 * on the same order gets the first one.
 *
 * This replaced an order-wide ladder. Order-wide counting let someone reach a
 * deep discount with one vial of ten different compounds, which is not what
 * volume pricing is for.
 *
 * OWNER DECISION — the numbers below are the only thing to edit. `bulkTiers`
 * is the single source of truth: the homepage section, the /bulk builder, the
 * cart math (lib/totals.ts) and the WooCommerce coupon names all read it.
 * These percentages come from the reference page, not from this store's
 * margins — CONFIRM THEM BEFORE LAUNCH.
 *
 * Promo codes do not apply to bulk orders (owner rule 2026-09-22): once any
 * product qualifies, bulk pricing is the pricing and PT25 goes dormant.
 * Because the first rung is well above PT25's 25%, a bulk buyer is never
 * worse off for it.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { brandConfig } from "./brand-config";

/** One rung of the bulk ladder. Thresholds count units of a SINGLE product. */
export interface BulkTier {
  /** Minimum units of one product (across its strengths) to earn this tier. */
  minUnits: number;
  /** Percent off that product's lines. */
  percentOff: number;
  /** The WooCommerce coupon code that carries this tier server-side. */
  code: string;
  /** Ladder label, e.g. "10+ units". */
  label: string;
  /** Short chip label for the order rail, e.g. "10+ units · 40%". */
  chip: string;
}

export const bulkTiers: BulkTier[] = [
  {
    minUnits: 10,
    percentOff: 40,
    code: "BULK40",
    label: "10+ units",
    chip: "10+ units · 40%",
  },
  {
    minUnits: 50,
    percentOff: 50,
    code: "BULK50",
    label: "50+ units",
    chip: "50+ units · 50%",
  },
];

/** The per-product minimum — the first rung. Nothing below this discounts. */
export const bulkMinUnits = bulkTiers[0]!.minUnits;

/** At or above this many units in one order the site asks for a quote. */
export const bulkQuoteThreshold = 250;

/**
 * Short filter-pill labels, by category slug. The taxonomy's full names
 * ("Melanocortin & Dermal Research") do not fit a row of pills.
 */
export const bulkCategoryLabels: Record<string, string> = {
  "tissue-regeneration-research": "Tissue Repair",
  "metabolic-research": "Metabolic",
  "endocrine-research": "Secretagogue",
  "neuropeptide-research": "Neuro",
  "cellular-mitochondrial-research": "Cellular",
  "melanocortin-dermal-research": "Dermal",
  "research-blends": "Blends",
  "lab-supplies": "Supplies",
};

export const bulkCopy = {
  /** Nav + breadcrumb label. */
  navLabel: "Bulk Orders",

  /** Homepage section. */
  home: {
    eyebrow: "Bulk & wholesale",
    heading: "Order at volume, priced at volume",
    body: `Buy ${bulkMinUnits} or more units of any compound and that compound drops to bulk pricing. Strengths count together, so you can mix ${bulkMinUnits}mg and 30mg freely. Every vial still ships with its batch Certificate of Analysis.`,
    cta: "Build a bulk order",
    secondaryCta: "Request a quote",
    ladderHeading: "Volume pricing",
    unitsHeading: "Units per product",
    discountHeading: "You pay",
    quoteLabel: `${bulkQuoteThreshold}+ units`,
    quoteValue: "Custom quote",
    quotePerk: "Contract pricing, scheduled deliveries",
    note: `Minimums and discounts apply per product, counted across its strengths. Gift cards are excluded.`,
  },

  /** /bulk page header. */
  page: {
    title: "Bulk Orders",
    eyebrow: "Bulk & wholesale",
    heading: "Volume pricing for research programs",
    body: `Pick any products, ${bulkMinUnits} units minimum each. The same stock, the same lots and the same certificates — priced for quantity.`,
    metaDescription:
      "Volume pricing on research compounds from Primetime Research. 10 units of any compound unlocks bulk pricing; mix strengths freely.",
  },

  /** The product grid. */
  builder: {
    filterAll: "All",
    searchLabel: "Filter compounds",
    searchPlaceholder: "Search compounds…",
    empty: "No compound matches that filter.",
    coaChip: "COA",
    outOfStock: "Out of stock",
    perUnit: "/unit",
    atDiscount: (percent: number) => `at ${percent}% off`,
    /** The card's primary action. */
    addUnits: (units: number) => `Add ${units} units`,
    added: (name: string, units: number) => `${units} × ${name} added`,
    /** Shown on a card once it already has units in the order. */
    inOrder: (units: number) => `${units} in order`,
    addMore: (units: number) => `Add ${units} more`,
    remove: "Remove",
  },

  /** The sticky order rail. */
  rail: {
    heading: "Your bulk order",
    units: (n: number) => `${n} ${n === 1 ? "unit" : "units"}`,
    /** Dashed empty state, two lines. */
    emptyLine1: `Pick any products, ${bulkMinUnits} units minimum each.`,
    emptyLine2: `${bulkTiers[0]!.percentOff}% off from ${bulkTiers[0]!.minUnits} units, ${bulkTiers[1]!.percentOff}% off from ${bulkTiers[1]!.minUnits}.`,
    /** Fine print under the tier chips. */
    finePrint:
      "Minimums and discounts apply per product, counted across its strengths. Mix strengths freely.",
    ctaEmpty: `Add ${bulkMinUnits}+ units to start`,
    cta: "Add order to cart",
    ctaBusy: "Adding…",
    clear: "Clear order",
    subtotal: "Subtotal",
    discount: "Bulk discount",
    total: "Estimated total",
    shipping: "Shipping",
    shippingFree: "Free",
    shippingAtCheckout: "Calculated at checkout",
    /** A product in the order that has not reached the minimum yet. */
    belowMinimum: (name: string, needed: number) =>
      `${name} needs ${needed} more to reach bulk pricing`,
    estimateNote:
      "An estimate. Checkout recalculates tax and shipping, and re-prices every line from the live catalog.",
    couponNote: (code: string) =>
      `Promo codes, including ${code}, do not apply to bulk orders.`,
  },

  /** Why-bulk cards under the builder. */
  benefits: [
    {
      title: "Same lots, same certificates",
      body: "Bulk pulls from the stock the catalog sells. Every vial carries its batch Certificate of Analysis with HPLC purity and mass-spec identity.",
    },
    {
      title: "Mix strengths freely",
      body: `Units count across a compound's strengths. Five 10mg and five 30mg vials are ${bulkMinUnits} units of that compound and earn its bulk price.`,
    },
    {
      title: "Reserved lots",
      body: "On large orders we can hold a single lot so a study runs start to finish on one batch. Ask when you order.",
    },
    {
      title: "Terms for institutions",
      body: "Purchase orders, W-9s and scheduled deliveries are available for universities and commercial laboratories. Request them with a quote.",
    },
  ],

  /**
   * Cart + checkout. Shown wherever a promo code meets a bulk order — the one
   * place the rule has to be stated in plain words rather than implied by a
   * number that failed to change.
   */
  cart: {
    /** Rejection when a code is entered on a cart that already earns a tier. */
    couponBlocked: (code: string, units: number) =>
      `Coupon "${code}" cannot be applied. This is a bulk order (${units} units at bulk pricing) and bulk pricing is already applied.`,
    /** Note beside a dormant code the buyer added before going bulk. */
    couponDormant: (code: string) =>
      `${code} is not applied — bulk pricing replaces promo codes on this order.`,
    /** Label on the discount row when bulk pricing is charging. */
    tierLabel: (units: number) => `${units} units`,
  },

  /** Quote request form. */
  quote: {
    eyebrow: "Contract pricing",
    heading: "Request a bulk quote",
    body: `For orders above ${bulkQuoteThreshold} units, standing schedules, or purchase-order terms, send the details and our team will respond with pricing.`,
    nameLabel: "Full name",
    emailLabel: "Work email",
    orgLabel: "Organization",
    orgTypeLabel: "Organization type",
    orgTypes: [
      "Private Research",
      "Academic Institution",
      "Commercial Laboratory",
      "Clinical Research",
    ],
    phoneLabel: "Phone (optional)",
    compoundsLabel: "Compounds and quantities",
    compoundsPlaceholder:
      "e.g. BPC-157 10mg x 50, TB-500 10mg x 25, GHK-Cu 50mg x 20",
    cadenceLabel: "How often",
    cadenceOptions: ["One-time order", "Monthly", "Quarterly", "Not sure yet"],
    notesLabel: "Anything else (optional)",
    notesPlaceholder:
      "Reserved lot, delivery window, purchase-order terms, documentation needs…",
    consentLabel:
      "I confirm this order is for laboratory research use only and not for human or veterinary consumption.",
    submit: "Send request",
    submitting: "Sending…",
    successHeading: "Request received",
    successBody: `Our team will reply from ${brandConfig.domain} within one business day. For anything urgent, email ${"contact@primetimeresearch.info"}.`,
    errorHeading: "That did not send",
    required: "Required",
    invalidEmail: "Enter a valid email address",
    consentRequired: "Please confirm research use to continue",
    genericError: "Something went wrong. Please email us instead.",
    prefillNote: "Prefilled from the order you built above.",
  },

  /** Page FAQ. */
  faq: {
    heading: "Bulk ordering questions",
    items: [
      {
        q: "How is a unit counted?",
        a: `One vial is one unit, whatever its strength. Units are counted per compound across its strengths, so five 10mg and five 30mg vials of the same compound are ${bulkMinUnits} units of it and earn its bulk price.`,
      },
      {
        q: "Do I need 10 of every product?",
        a: `Yes — the minimum applies per product. A compound below ${bulkMinUnits} units is charged at its normal price; it does not stop the other compounds in the order from earning theirs.`,
      },
      {
        q: "Can I use a promo code on a bulk order?",
        a: "No. Promo codes do not apply to bulk orders — once a product reaches the minimum, bulk pricing replaces them. Bulk pricing is far deeper than our standing code, so a bulk order is never the more expensive route.",
      },
      {
        q: "Is bulk stock the same stock?",
        a: "Yes. There is no separate bulk catalog. Orders ship from the same inventory with the same lot-matched Certificate of Analysis.",
      },
      {
        q: "Can I get one lot across the whole order?",
        a: "On large orders we can usually reserve a single lot so results stay comparable across a study. Note it on the quote request and we will confirm availability.",
      },
      {
        q: "Do you accept purchase orders?",
        a: "For universities and commercial laboratories, yes. Request purchase-order terms with a bulk quote and our team will send the paperwork.",
      },
    ],
  },
} as const;
