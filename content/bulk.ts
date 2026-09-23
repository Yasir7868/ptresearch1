/**
 * Bulk / wholesale ordering — tier ladder and copy.
 *
 * This page has no live ptresearch.shop counterpart, so its copy is written
 * here rather than harvested (PRODUCT.md "Verbatim client copy" covers pages
 * that exist live). Components still read every string from this file.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * OWNER DECISION — the numbers below are the only thing to edit.
 *
 * `bulkTiers` is the single source of truth for the ladder. The homepage
 * section, the /bulk builder, the cart math (lib/cart.tsx) and the
 * WooCommerce coupon names all read it. Change a threshold or a percentage
 * here and every surface follows — but the matching WooCommerce coupon must
 * be edited to agree, or server totals will differ from what the site quotes
 * (see README "Bulk ordering").
 *
 * OWNER RULE (2026-09-22): promo codes do not apply to bulk orders. Once an
 * order earns a tier, bulk pricing IS the pricing — PT25
 * (brandConfig.promos.coupon) is refused at entry and goes dormant if it was
 * already in the cart. It counts again only if the order drops back below the
 * first rung. lib/cart.tsx enforces this; WooCommerce mirrors it with a
 * maximum-quantity restriction on PT25 (see README "Bulk ordering").
 *
 * That rule makes the ladder's own numbers load-bearing: a buyer at 5 units
 * gives up 25% (PT25) to gain 10% (BULK10), which is a price INCREASE. The
 * first rung should therefore sit at or above the standing coupon while that
 * coupon runs. The defaults below are set accordingly.
 * ──────────────────────────────────────────────────────────────────────────
 */

import { brandConfig } from "./brand-config";

/** One rung of the bulk ladder. */
export interface BulkTier {
  /** Minimum total units in the order to earn this tier. */
  minUnits: number;
  /** Percent off the discountable subtotal. */
  percentOff: number;
  /** The WooCommerce coupon code that carries this tier server-side. */
  code: string;
  /** Ladder label, e.g. "10+ units". */
  label: string;
  /** One line of what the tier adds beyond the discount. */
  perk: string;
}

/**
 * The ladder, ascending. Units = total quantity across every research
 * compound in the order (sizes and compounds mix freely — a 10mg vial and a
 * 60mg vial each count as one unit), which is how WooCommerce's own
 * "minimum quantity" coupon restriction counts.
 */
export const bulkTiers: BulkTier[] = [
  // PLACEHOLDER MARGINS — confirm these before launch. The first rung matches
  // the standing PT25 coupon deliberately: because codes do not apply to bulk
  // orders, a first rung BELOW 25% would make the 5th vial cost a buyer MORE
  // than the 4th. Every rung must be >= brandConfig.promos.coupon.percentOff
  // for as long as that coupon runs.
  {
    minUnits: 5,
    percentOff: 25,
    code: "BULK25",
    label: "5+ units",
    perk: "Automatic at checkout",
  },
  {
    minUnits: 10,
    percentOff: 30,
    code: "BULK30",
    label: "10+ units",
    perk: "Free shipping, any order total",
  },
  {
    minUnits: 25,
    percentOff: 35,
    code: "BULK35",
    label: "25+ units",
    perk: "Priority handling, batch COAs bundled",
  },
  {
    minUnits: 50,
    percentOff: 40,
    code: "BULK40",
    label: "50+ units",
    perk: "Named contact, reserved lot on request",
  },
];

/** At or above this many units the site asks for a quote instead of quoting. */
export const bulkQuoteThreshold = 100;

/** Tiers at or above this rung ship free regardless of order total. */
export const bulkFreeShippingMinUnits = 10;

export const bulkCopy = {
  /** Nav + breadcrumb label. */
  navLabel: "Bulk Orders",

  /** Homepage section. */
  home: {
    eyebrow: "Bulk & wholesale",
    heading: "Order at volume, priced at volume",
    body: "Laboratories, universities and repeat purchasers pay less per vial as the order grows. Mix any compounds and any sizes — the discount is applied to the whole order automatically at checkout, and every vial still ships with its batch Certificate of Analysis.",
    cta: "Build a bulk order",
    secondaryCta: "Request a quote",
    ladderHeading: "Volume pricing",
    unitsHeading: "Order size",
    discountHeading: "You pay",
    quoteLabel: `${bulkQuoteThreshold}+ units`,
    quoteValue: "Custom quote",
    quotePerk: "Contract pricing, scheduled deliveries",
    note: "Discounts apply to research compounds. Gift cards are excluded.",
  },

  /** /bulk page header. */
  page: {
    title: "Bulk Orders",
    eyebrow: "Bulk & wholesale",
    heading: "Volume pricing for research programs",
    body: "Build the order below and the tier is applied as you go. Nothing here is a separate catalog — it is the same stock, the same lots and the same certificates, priced for quantity.",
    metaDescription:
      "Volume pricing on research compounds from Primetime Research. Mix compounds and sizes, see your tier as you build the order, or request contract pricing.",
  },

  /** The builder. */
  builder: {
    heading: "Build your order",
    searchLabel: "Filter compounds",
    searchPlaceholder: "Filter by name or category…",
    categoryAll: "All categories",
    sizeLabel: "Size",
    qtyLabel: "Quantity",
    unitPrice: "Unit price",
    lineTotal: "Line total",
    empty: "No compound matches that filter.",
    noSelection:
      "Set a quantity on any compound to start. The tier updates as the order grows.",
    inStock: "In stock",
    outOfStock: "Out of stock",
    coaChip: "COA",
    remove: "Clear",
    clearAll: "Clear order",
    addAll: "Add order to cart",
    adding: "Adding…",
    added: (units: number) =>
      `${units} ${units === 1 ? "unit" : "units"} added to cart`,
  },

  /** The live summary rail. */
  summary: {
    heading: "Order summary",
    units: "Units",
    subtotal: "Subtotal",
    tier: "Bulk tier",
    noTier: "None yet",
    discount: (percent: number) => `Bulk discount (${percent}%)`,
    shipping: "Shipping",
    shippingFree: "Free",
    shippingAtCheckout: "Calculated at checkout",
    total: "Estimated total",
    perUnit: (price: string) => `${price} per unit`,
    saved: (amount: string) => `You save ${amount}`,
    toNextTier: (units: number, percent: number) =>
      `Add ${units} more ${units === 1 ? "unit" : "units"} for ${percent}% off`,
    atTop: `Past ${bulkQuoteThreshold} units? Request contract pricing below.`,
    couponNote: (code: string) =>
      `Promo codes, including ${code}, do not apply to bulk orders. Bulk pricing replaces them.`,
    estimateNote:
      "An estimate. WooCommerce recalculates tax and shipping at checkout.",
  },

  /** Why-bulk cards under the builder. */
  benefits: [
    {
      title: "Same lots, same certificates",
      body: "Bulk pulls from the stock the catalog sells. Every vial carries its batch Certificate of Analysis with HPLC purity and mass-spec identity.",
    },
    {
      title: "Mix freely",
      body: "Units count across the whole order. Ten different compounds at one vial each earns the same tier as ten vials of one compound.",
    },
    {
      title: "Reserved lots",
      body: "On orders of 50 units or more we can hold a single lot so a study runs start to finish on one batch. Ask when you order.",
    },
    {
      title: "Terms for institutions",
      body: "Purchase orders, W-9s and scheduled deliveries are available for universities and commercial laboratories. Request them with a quote.",
    },
  ],

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

  /**
   * Cart + checkout. Shown wherever a promo code meets a bulk order — the one
   * place the rule has to be stated in plain words rather than implied by a
   * number that failed to change.
   */
  cart: {
    /** Rejection when a code is entered on a cart that already earns a tier. */
    couponBlocked: (code: string, units: number) =>
      `Coupon "${code}" cannot be applied. This is a bulk order (${units} units) and bulk pricing is already applied.`,
    /** Note beside a dormant code the buyer added before going bulk. */
    couponDormant: (code: string) =>
      `${code} is not applied — bulk pricing replaces promo codes on this order.`,
    /** Label on the discount row when a tier is charging. */
    tierLabel: (units: number) => `${units} units`,
  },

  /** Page FAQ. */
  faq: {
    heading: "Bulk ordering questions",
    items: [
      {
        q: "How is a unit counted?",
        a: "One vial is one unit, whatever its size. Quantities add up across every research compound in the order, so a mixed order reaches a tier as fast as a single-compound one.",
      },
      {
        q: "Can I use a promo code on a bulk order?",
        a: "No. Promo codes do not apply to bulk orders — once the order reaches the first tier, bulk pricing replaces them. Bulk pricing starts at the same discount as our standing code and goes up from there, so a bulk order is never the more expensive route.",
      },
      {
        q: "Is bulk stock the same stock?",
        a: "Yes. There is no separate bulk catalog. Orders ship from the same inventory with the same lot-matched Certificate of Analysis.",
      },
      {
        q: "Can I get one lot across the whole order?",
        a: "On orders of 50 units or more we can usually reserve a single lot so results stay comparable across a study. Note it on the quote request and we will confirm availability.",
      },
      {
        q: "Do you accept purchase orders?",
        a: "For universities and commercial laboratories, yes. Request purchase-order terms with a bulk quote and our team will send the paperwork.",
      },
      {
        q: "How fast do bulk orders ship?",
        a: "Orders are processed within one business day. Large orders that need a reserved lot may take longer, and we confirm the date before charging.",
      },
    ],
  },
} as const;
