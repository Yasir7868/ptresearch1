// content/site-copy.ts
// VERBATIM copy from the LIVE site https://ptresearch.shop, re-harvested 2026-09-17:
// every URL in the live sitemaps, plus the side cart, cart page and checkout with an
// item in a throwaway cart session (no order placed).
//
// - Wording, spelling, capitalization and punctuation are exactly as rendered live,
//   including the live site's own typos and contradictions (LIVE COPY NOTES below).
//   Correct them here only together with the live site.
// - Emoji the live site uses (stat icons, the cart's "FREE GIFT" badge) are dropped:
//   PRODUCT.md bans emoji.
// - Elements the live site hides on every device (the "Buy One Get One 50% Off" banner,
//   the reviews widget) are not copy and are not carried over.
// - Product names and descriptions are NOT in this file: they come from WooCommerce
//   through the catalog mapper (HARD RULE #1 GLP coding applies there).
// - Brand name, tagline and promo labels live in content/brand-config.ts; RUO /
//   compliance lines live in content/compliance.ts.
//
// LIVE COPY NOTES (as published on 2026-09-17):
// - Header nav spells the gift card link "Digtal Gift Card".
// - Footer tagline and the catalog meta description say "At Prime research"; the
//   homepage FAQ says "Primetime research"; Terms §1 says "Primetime research website".
// - FAQ page: "Who can purchase from Primetime Peptides?" / "This product is only
//   available to researchers only."
// - Terms and Privacy are issued by "PrimeTime Peptides"; Privacy §1 still names the
//   old domain primetimepeptides.com.
// - Terms §8 sends damaged-shipment reports to support@ptresearch.shop; everything else
//   uses contact@primetimeresearch.info.
// - The age gate requires 21+; Terms §2 and Privacy §9 say 18.
// - The homepage says "2-Day Shipping"; the FAQ says 2-4 business days.
// - The homepage shows both "21+ States Covered" and "50+ States".

export interface FaqItem { q: string; a: string; }
export interface FaqGroup { label: string; items: FaqItem[]; }
export interface LegalBlock { type: 'p' | 'li' | 'subheading'; text: string; }
export interface LegalSection { heading: string; blocks: LegalBlock[]; }
export interface LegalDocumentCopy {
  /** Heading at the top of the live page. */
  title: string;
  /** Browser-tab title on the live page (before " - Primetime Research"). */
  metaTitle: string;
  /** Issuing entity line under the heading. */
  entity: string;
  lastUpdated: string;
  sections: LegalSection[];
}
export interface TrustBadge { title: string; body: string; }
export interface StatItem { value: string; label: string; }
/** A sentence with one inline link, e.g. "…described in our [privacy policy]." */
export interface LinkedSentence { before: string; link: string; after: string; }

// ── Site chrome ─────────────────────────────────────────────────────────────
// Header navigation labels, in live order. The live "Contact Us" item is a
// mailto link to contactInfo.email; "Track Your Order" is a header button.
export const headerNav = {
  home: 'Home',
  catalog: 'Catalog',
  giftCard: 'Digtal Gift Card',
  coa: 'COA',
  contact: 'Contact Us',
  trackOrder: 'Track Your Order',
  searchPlaceholder: 'Search for products...',
};

// Footer, every page.
export const footerCopy = {
  tagline: 'At Prime research, we’re committed to providing researchers with the highest quality peptides and peptide blends in the industry.',
  linksHeading: 'Useful Links',
  links: {
    home: 'Home',
    catalog: 'Catalog',
    coa: 'COA',
    faq: 'FAQ',
    contact: 'Contact Us',
    privacy: 'Privacy Policy',
    terms: 'TERMS AND CONDITIONS',
  },
};

// The store's public contact address as shown in the header, footer, product
// pages, Terms §10/§20 and Privacy §8/§13. Product pages print it "Contact@…".
// The "Need Help?" block closes every live product page.
export const contactInfo = {
  email: 'contact@primetimeresearch.info',
  emailUsLabel: 'Email us:',
  needHelpHeading: 'Need Help?',
  needHelpBody: 'Send us a message and our team will guide you.',
  cta: 'Contact Us',
};

// ── Age gate (live homepage popup) ──────────────────────────────────────────
// The role <select> has no label on the live site. Its disclaimer line is
// compliance.ageGateDisclaimer.
export const ageGate = {
  heading: 'TO ENTER THIS WEBSITE YOU MUST BE OVER 21 YEARS OLD',
  subtext: 'By entering this site, you are accepting our Terms and Conditions',
  confirmAge: 'I am 21 years of age or older.',
  confirmUse: 'I understand these products are for research use only and are not for human consumption.',
  roleOptions: ['Private Research', 'Academic Institution', 'Commercial Laboratory', 'Clinical Research'],
  acceptLabel: 'Accept',
  declineLabel: 'Decline',
};

// Live /access-denied/ page (where Decline leads on the live site).
export const accessDenied = {
  heading: 'Access Denied',
  body: '– YOU MUST BE OVER 21 TO PREVIEW OUR WEBSITE –',
};

// ── Homepage, in live order ─────────────────────────────────────────────────
// 1. Hero + the trust card beside it.
export const heroCopy = {
  eyebrow: 'HIGHEST QUALITY',
  heading: 'Premium-Grade Peptides',
  body: 'At Primetime Research, we’re committed to providing researchers with the highest quality peptides and peptide blends in the industry. Manufactured and compounded in the USA under strict quality standards. These products are for research use only and not intended for human or animal consumption, diagnostic use, or therapeutic application of any kind.',
  cta: 'View Catalog',
  trustHeading: 'Trusted by Researchers Worldwide',
  /** Rendered live as one heading: "99%+ Purity". */
  trustStat: { value: '99%+', label: 'Purity' },
  trustBody: 'Every batch is tested in certified facilities and documented with a Certificate of Analysis — uncompromising standards for research use.',
  trustCta: 'View COAs',
};

// 2. Scrolling ticker under the hero (repeats "PEPTIDES FOR RESEARCH ◦"), then the
//    shipping strip (brandConfig.promos: "2-Day Shipping | Free Shipping $200+").
export const marquee = 'PEPTIDES FOR RESEARCH';

// 3. Product carousel — no heading on the live site (slugs: app/page.tsx).

// 4. Brand block: brandConfig.name + brandConfig.tagline, then these four badges.
export const trustBadges: TrustBadge[] = [
  { title: 'Research Use Only', body: 'All products are intended strictly for laboratory research not for human consumption, medical, or veterinary use' },
  { title: '3rd Party Tested', body: 'Every batch is tested for identity and purity through certified U.S.A. Based Labs.' },
  { title: 'Customer Services', body: 'Reach us anytime for real-time assistance and expert guidance.' },
  { title: 'Credit Cards Accepted', body: 'All transactions are encrypted and processed with top-tier security protocols.' },
];

// 5. Supplier block + stats.
export const supplierBlock = {
  eyebrow: 'Trusted Research Supplier',
  heading: 'Advancing Scientific Discovery with Premium Research Peptides',
  body: 'Every product is manufactured exclusively for laboratory research and analytical applications. Not for human consumption. Intended solely for qualified research professionals, with a commitment to consistency, transparency, and uncompromising quality.',
  stats: [
    { value: '10K+', label: 'Researchers Served' },
    { value: '21+', label: 'States Covered' },
    { value: '100%', label: 'For Research Use Only' },
    { value: '12+', label: 'Years Combined Experience' },
  ] as StatItem[],
};

// 6. About block + stats. The heading renders "Your trusted source for" / line
//    break / "high-purity peptides" (highlighted).
export const aboutCopy = {
  brand: 'Primetime Research',
  headingLead: 'Your trusted source for',
  headingEmphasis: 'high-purity peptides',
  body: 'At Primetime Research, we empower researchers with premium-grade peptides rigorously tested, consistently pure, and delivered fast. All products are intended strictly for laboratory research purposes only and are not for human consumption.',
  standardsLine: 'All peptides and compounds sold by Primetime Research are analytical-grade biochemical reference standards, manufactured and tested to strict purity and identity specifications for laboratory use.',
  assurance: 'Every batch is USA Based Labs verified for identity and purity. No exceptions. No shortcuts. Because your research depends on it and so does ours.',
  cta: 'View Catalog',
  stats: [
    { value: '99%', label: 'Purity' },
    { value: '50+', label: 'States' },
    { value: '12+', label: 'Years' },
  ] as StatItem[],
};

// 7. Homepage FAQ — a shorter set than the /faq/ page, with different wording.
export const homepageFaq = {
  eyebrow: "FAQ's",
  heading: 'here’s what you should know',
  body: 'Get answers to common questions about our research peptides, quality standards, and ordering process.',
  items: [
    {
      "q": "What are your products intended for?",
      "a": "All products offered by Primetime research are intended strictly for research, laboratory, and analytical use only. They are not approved for human or veterinary use."
    },
    {
      "q": "What does “batch produced” mean?",
      "a": "Batch production means each product is manufactured in controlled groups to ensure consistency across every unit. This allows for repeatable processes and reliable outcomes from one batch to the next."
    },
    {
      "q": "Are your products tested?",
      "a": "Yes. Each batch undergoes analytical testing to verify identity, consistency, and overall quality. This ensures that every product meets strict internal standards before release."
    },
    {
      "q": "Do you provide Certificates of Analysis (COAs)?",
      "a": "Yes. Batch-specific COAs are available for all products. These reports provide documented analytical data for each batch, supporting transparency and verification."
    },
    {
      "q": "How quickly are orders processed?",
      "a": "Orders are processed efficiently to ensure timely fulfillment. Processing times may vary depending on order volume, but we prioritize speed and accuracy in every shipment."
    }
  ] as FaqItem[],
};

// ── 2026-09 CRO redesign: site chrome + homepage ────────────────────────────
// The design's own labels, from the Claude Design file "Primetime
// Research.dc.html" (header, research bar, footer, homepage). Wherever the
// design reuses live copy, components read the live blocks above (heroCopy,
// trustBadges, supplierBlock, aboutCopy, homepageFaq, footerCopy) instead.
// Lines the design states that the live site's own policies contradict were
// replaced with live wording; each is noted inline.
export const redesignChrome = {
  // The design's "Gift Card" item, in the live header's position (after
  // Catalog). Live spells it "Digtal Gift Card" (giftCardCopy.navLabel); the
  // redesign nav uses its own shorter labels throughout, as it does for
  // "COA / Lab Results" and "Contact".
  nav: {
    catalog: 'Catalog',
    giftCard: 'Gift Card',
    coa: 'COA / Lab Results',
    faq: 'FAQ',
    contact: 'Contact',
  },
  trackOrder: 'Track order',
  cart: 'Cart',
  menu: 'Menu',
  searchLabel: 'Search products',
  searchPlaceholder: 'Search BPC-157, GLP, Semax…',
  footer: {
    policiesHeading: 'Policies',
    // Design: "Shipping & Reship Policy". The live site publishes no reship
    // policy (Terms §8: "All sales are final."), so the link is named for
    // the page it opens.
    shipping: 'Shipping Policy',
    refunds: 'Refunds',
    // Design listed Mastercard; live checkout: "Mastercard is not accepted."
    payments: 'Encrypted checkout · Visa · Amex · Discover',
  },
};

export const redesignHome = {
  hero: {
    /** heroCopy.heading with the design's closing period. */
    heading: 'Premium-Grade Peptides.',
    emphasis: '99%+ purity, every batch.',
    stats: [
      { value: '99%+', label: 'Purity, HPLC verified' },
      { value: '10K+', label: 'Researchers served' },
      { value: '2-Day', label: 'Shipping · free $200+' },
      { value: '12+', label: 'Years combined experience' },
    ] as StatItem[],
  },
  trustStrip: [
    '3rd-party tested in certified U.S. labs',
    'Certificate of Analysis on every batch',
    // Design: "Reship or refund if damaged in transit" — not a live policy
    // (Terms §8: "All sales are final."). Terms §7 instead:
    'Orders processed within one business day',
    'Encrypted checkout · Credit cards accepted',
  ],
  // The category grid this label belonged to was dropped on 2026-09-24 (the
  // marquee took its slot); the label moved to the best-sellers heading, which
  // is now the homepage's route into the catalog.
  bestSellers: {
    eyebrow: 'Best sellers',
    heading: 'Most ordered this month',
    note: 'All prices include batch COA',
    browseAll: 'Browse all products',
    addToCart: 'Add to cart',
    selectSize: 'Select size',
    inStock: 'In stock',
    outOfStock: 'Out of stock',
    coaChip: 'COA',
    fromPrefix: 'from',
    added: (item: string) => `${item} added to cart`,
    save: (percent: number) => `SAVE ${percent}%`,
    /** Corner badge by product slug (otherwise SAVE n% on a deep discount). */
    badges: {
      'glow-blend-premium-research-peptides': 'BEST SELLER',
      rt: 'POPULAR',
    } as Record<string, string>,
    /**
     * Line under the product name, by slug. Blends not listed here show the
     * components from their live name, e.g. "Glow Blend (BPC-157 …)".
     */
    subtitles: {
      'glow-blend-premium-research-peptides': 'BPC-157 · TB-500 · GHK-Cu',
      'klow-blend-premium-research-compound-lab-grade': 'KPV · BPC-157 · TB-500 · GHK-Cu',
      'dsip-premium-research-peptide-lab-grade-peptide': 'Delta sleep-inducing peptide',
      'vip-premium-research-peptide-lab-grade-peptide': 'Vasoactive intestinal peptide',
      'semax-premium-research-peptide-lab-grade-peptide': 'Nootropic heptapeptide',
      'tr-2': 'Metabolic research compound',
      rt: 'Triple-agonist research compound',
      'melanotan-1-premium-research-peptide-lab-grade-peptide': 'Melanocortin research peptide',
      'ghk-cu-premium-research-peptide': 'Copper tripeptide',
    } as Record<string, string>,
  },
  coa: {
    eyebrow: '3rd party tested',
    /** aboutCopy.assurance, first two sentences. */
    heading: 'Every batch is USA Based Labs verified for identity and purity. No exceptions. No shortcuts.',
    /** heroCopy.trustBody + the closing sentence of aboutCopy.assurance. */
    body: 'Every batch is tested in certified facilities and documented with a Certificate of Analysis — uncompromising standards for research use. Because your research depends on it and so does ours.',
    checks: [
      { title: 'HPLC purity', body: '≥ 99% on every lot' },
      // Design: "Sequence confirmed". The certificates report HPLC purity and
      // a mass-spec identity check, not a sequencing result.
      { title: 'Mass spec identity', body: 'Mass confirmed' },
      { title: 'Lot-matched COA', body: 'Lookup by batch #' },
    ],
    batchLabel: 'Batch number',
    batchPlaceholder: (example: string) => `Enter batch number, e.g. ${example}`,
    findCoa: 'Find COA',
    // Design: "LATEST BATCH". The certificates carry no dates that would back
    // "latest", so the card says what it is.
    featuredLabel: 'Verified batch',
    featuredSlug: 'ghk-cu-premium-research-peptide',
    lotPrefix: 'Lot',
    imageAlt: 'Three Primetime Research peptide vials on ice.',
  },
};

// ── FAQ page (/faq/) ────────────────────────────────────────────────────────
export const faqPage = {
  heading: 'Frequently Asked Questions',
  groups: [
    {
      "label": "General",
      "items": [
        {
          "q": "What are peptides?",
          "a": "Peptides are short chains of amino acids linked by peptide bonds. They are smaller than proteins and serve as important research tools for studying biological processes, protein interactions, and cellular mechanisms.\n\nThey are not intended for human or veterinary use and are typically used in preclinical experiments, academic studies, or product development testing."
        },
        {
          "q": "Who can purchase from Primetime Peptides?",
          "a": "This product is only available to researchers only."
        }
      ]
    },
    {
      "label": "Quality & Purity",
      "items": [
        {
          "q": "What purity levels do you guarantee?",
          "a": "All our peptides are manufactured to a minimum purity of 99%. Each product is tested using HPLC and Mass Spectrometry, with results documented in the Certificate of Analysis."
        },
        {
          "q": "Are your peptides third-party tested?",
          "a": "Yes. We use independent laboratories to verify our quality claims, ensuring unbiased confirmation of purity and identity for complete transparency."
        }
      ]
    },
    {
      "label": "Shipping & Storage",
      "items": [
        {
          "q": "How do you ship temperature-sensitive peptides?",
          "a": "We use appropriate cold packs and insulated packaging for temperature-sensitive products. This cold chain approach ensures stability from our facility to your laboratory."
        },
        {
          "q": "How should I store my peptides?",
          "a": "Most peptides should be stored at -20°C for long-term storage. Once reconstituted, store at 4°C and use within the timeframe specified in the product documentation. Always protect from light and moisture."
        },
        {
          "q": "How long does shipping take?",
          "a": "Standard shipping typically takes 2-4 business days within the U.S."
        }
      ]
    },
    {
      "label": "Orders and Returns",
      "items": [
        {
          "q": "What is your return policy?",
          "a": "Due to the nature of research materials, we cannot accept returns on opened or used products. If you receive a damaged or incorrect item, please contact us within 48 hours of delivery."
        },
        {
          "q": "How can I track my order?",
          "a": "Once your order ships, you’ll receive a confirmation email with tracking information. You can also track your order status through your account dashboard or through our track your order page."
        }
      ]
    }
  ] as FaqGroup[],
};

export const faqItems: FaqItem[] = faqPage.groups.flatMap((group) => group.items);

// Newsletter block — shown in the footer of the live /faq/ page only.
export const newsletter = {
  heading: 'Subscribe to our emails',
  body: 'Be the first to know about new collections and special offers.',
  emailPlaceholder: 'Email address',
};

// ── Catalog (/catalog/) ─────────────────────────────────────────────────────
export const catalogPage = {
  title: 'Catalog',
  breadcrumbHome: 'Home',
  searchPlaceholder: 'Search for products...',
  saleBadge: 'Sale!',
  addToCart: 'Add to cart',
  selectOptions: 'Select options',
  readMore: 'Read more',
  sortByPriceAsc: 'Sort by price: low to high',
  sortByPriceDesc: 'Sort by price: high to low',
  /** WooCommerce result count on the live category archives. */
  resultCount: (count: number) => (count === 1 ? 'Showing the single result' : `Showing all ${count} results`),
  /** WooCommerce's default empty-results notice (live search renders nothing). */
  noResults: 'No products were found matching your selection.',
};

// ── Product page template (every live product) ──────────────────────────────
// "Description" shows the WooCommerce short description; "Usage" and "FAQ" come
// from the long description. Every product's sizes sit under "Dosage" pills.
export const productPage = {
  questionsPrefix: 'Questions about',
  inStock: 'In Stock',
  outOfStock: 'Out of Stock',
  categoryLabel: 'Category:',
  dosageLabel: 'Dosage',
  shipsToday: 'Order Now, Ships Today',
  purchaseType: 'One-time purchase',
  addToCart: 'Add to cart',
  outOfStockButton: 'Out of stock',
  /** WooCommerce's alert when Add to cart is pressed before a dosage is picked. */
  selectOptionsAlert: 'Please select some product options before adding this product to your cart.',
  descriptionHeading: 'Description',
  usageHeading: 'Usage',
  faqHeading: 'FAQ',
  // Live: "Disclaimer: This product is for <strong>Research Use Only</strong>."
  disclaimerLabel: 'Disclaimer:',
  disclaimerLead: 'This product is for',
  disclaimerEmphasis: 'Research Use Only',
  disclaimerEnd: '.',
  relatedHeading: 'Related Products',
};

// ── COA page (/coa/) ────────────────────────────────────────────────────────
// A searchable product list; each row opens the certificate PDF in a panel.
export const coaPage = {
  title: 'COA',
  searchPlaceholder: 'Search by product name...',
  productNameLabel: 'PRODUCT NAME',
  purityButton: 'Purity',
  endotoxinButton: 'Endotoxin',
  purityCertificate: 'Purity Certificate',
  endotoxinCertificate: 'Endotoxin Certificate',
  openPdf: 'Open PDF in New Tab',
  selectedDocumentLabel: 'Selected Document',
  dosageLabel: 'Dosage',
  priceLabel: 'Price',
  addToCart: 'Add to Cart',
  selectDosage: 'Select a Dosage',
  adding: 'Adding...',
  added: 'Added ✓',
  addError: 'Could not add product to cart.',
};

// ── Track Your Order (/track-your-order/) ───────────────────────────────────
export const trackOrderPage = {
  title: 'Track Your Order',
  intro: 'To track your order please enter your Order ID in the box below and press the "Track" button. This was given to you on your receipt and in the confirmation email you should have received.',
  orderIdLabel: 'Order ID',
  orderIdPlaceholder: 'Found in your order confirmation email.',
  emailLabel: 'Billing email',
  emailPlaceholder: 'Email you used during checkout.',
  submit: 'Track',
};

// ── Side cart (every page) ──────────────────────────────────────────────────
export const sideCartCopy = {
  title: 'Your Cart',
  empty: 'Your cart is empty',
  returnToShop: 'Return to Shop',
  continueShopping: 'Continue Shopping',
  subtotal: 'Subtotal',
  note: 'Shipping, taxes, and discounts calculated at checkout.',
  viewCart: 'View Cart',
  checkout: 'Checkout',
};

// ── Cart page (/cart/) ──────────────────────────────────────────────────────
export const cartPage = {
  title: 'Cart',
  columns: { product: 'Product Title', price: 'Price', quantity: 'Quantity', subtotal: 'Subtotal' },
  couponPlaceholder: 'Coupon code',
  applyCoupon: 'Apply Coupon',
  /** WooCommerce notice for an unknown code (live, 2026-09-17). */
  couponNotFound: (code: string) => `Coupon "${code.toLowerCase()}" cannot be applied because it does not exist.`,
  continueShopping: 'Continue Shopping',
  subtotal: 'Subtotal',
  shipment: 'Shipment',
  total: 'Total',
  proceedToCheckout: 'Proceed to Checkout',
  empty: 'Your cart is currently empty.',
  returnToShop: 'Return to shop',
};

// ── Checkout (/checkout/) ───────────────────────────────────────────────────
// The live store offers a single card gateway. The Zelle/Venmo pages still exist
// on the live site but are not offered at checkout.
export const checkoutPage = {
  title: 'Checkout',
  contactHeading: 'Contact',
  emailLabel: 'Email address',
  emailHelp: 'Order number and receipt will be sent to this email address.',
  shippingHeading: 'Shipping address',
  firstNameLabel: 'First name',
  lastNameLabel: 'Last name',
  companyLabel: 'Company name (optional)',
  countryLabel: 'Country / Region',
  streetLabel: 'Street address',
  streetHelp: 'House number and street name',
  apartmentLabel: 'Apartment, suite, unit, etc. (optional)',
  apartmentPlaceholder: 'Apartment, unit, building, floor, etc.',
  cityLabel: 'Town / City',
  stateLabel: 'State',
  statePlaceholder: 'Select an option…',
  zipLabel: 'ZIP Code',
  phoneLabel: 'Phone (optional)',
  shippingMethodHeading: 'Shipping method',
  notesHeading: 'Additional notes',
  notesLabel: 'Order notes (optional)',
  notesPlaceholder: 'Notes about your order, e.g. special notes for delivery.',
  billingHeading: 'Billing address',
  sameAsShipping: 'Same as shipping address',
  newsletterOptIn: 'Yes, I want to receive your newsletter.',
  couponToggle: 'Add coupon code',
  couponPlaceholder: 'Enter your code here',
  couponApply: 'Apply',
  paymentHeading: 'Payment method',
  paymentMethod: {
    label: 'Pay securely',
    description: 'Pay securely with Visa, American Express, or Discover. Mastercard is not accepted.',
    afterOrder: 'After you place your order, you will continue to a secure page to enter your payment details and complete payment.',
  },
  privacyNotice: {
    before: 'Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our ',
    link: 'privacy policy',
    after: '.',
  } as LinkedSentence,
  termsCheckbox: {
    before: 'I have read and agree to the website ',
    link: 'terms and conditions',
    after: '',
  } as LinkedSentence,
  /** WooCommerce's default notice when the terms box is left unchecked. */
  termsRequired: 'Please read and accept the terms and conditions to proceed with your order.',
  placeOrder: 'Pay Now',
  summaryHeading: 'Order summary',
  editCart: 'Edit cart',
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  total: 'Total',
  giftCardPrompt: 'Redeem a gift card?',
};

// ── Checkout, payment step ──────────────────────────────────────────────────
// NOT harvested. The live WooCommerce checkout sends the buyer to a separate
// hosted page after "Pay Now"; this site keeps them here and embeds the
// processor's card surface instead, so the step needs labels the live site
// never had. The live line checkoutPage.paymentMethod.afterOrder already
// describes this exact flow, so it is reused rather than rewritten.
export const checkoutPayment = {
  heading: 'Payment',
  backToDetails: 'Edit order details',
  /** Section 04 before the details above are complete enough to load the card. */
  awaitingDetails: 'Complete your contact and shipping details above, and accept the terms, to load the secure card form here.',
  /** Re-arm after unlocking the details without changing anything. */
  resumePayment: 'Continue to payment',
  shipTo: 'Shipping to',
  payingTotal: 'Amount due',
  /**
   * The server re-priced the order and got a different total from the cart
   * (stock change, price change, a stale tab). The server figure is the one
   * being charged, so it is stated plainly before the card is entered.
   */
  repriced: (total: string) => `Prices changed while you were checking out. The amount now due is ${total}. Review it before paying, or go back to edit your order.`,
  /** When no gateway credentials are configured on the deployment. */
  unavailableHeading: 'Payment is not available',
  unavailableBody: 'Card payment is not configured on this deployment, so no order can be placed. Please contact us to complete your order.',
  /** Confirmation page, while the gateway is being asked about the session. */
  confirming: 'Confirming your payment…',
  confirmedPaid: 'Payment confirmed',
  confirmedPending: 'Payment is still processing. We will email you when it settles.',
  confirmFailed: 'We could not confirm the payment status automatically. Your order number is below — contact us if you do not receive a confirmation email.',
};

// ── Order received ──────────────────────────────────────────────────────────
// WooCommerce's standard thank-you strings. Not verifiable on the live site
// without placing a real order. "No order found." is live (/venmo-payment/).
export const orderReceivedPage = {
  heading: 'Thank you. Your order has been received.',
  orderNumberLabel: 'Order number:',
  dateLabel: 'Date:',
  emailLabel: 'Email:',
  totalLabel: 'Total:',
  paymentMethodLabel: 'Payment method:',
  detailsHeading: 'Order details',
  notFound: 'No order found.',
};

// ── Terms and Conditions (/terms-and-conditions/) ───────────────────────────
// Legal wording preserved exactly (18+, RUO, in vitro, Wyoming law, AAA arbitration).
export const termsPage: LegalDocumentCopy = {
  title: 'Terms and Conditions',
  metaTitle: 'TERMS AND CONDITIONS',
  entity: 'PrimeTime Peptides',
  lastUpdated: 'Last Updated: February 22, 2026',
  sections: [
    {
      "heading": "1. Acceptance of Terms",
      "blocks": [
        {
          "type": "p",
          "text": "By accessing or using the Primetime research website (ptresearch.shop), purchasing products, or engaging with our services (\"Company,\" \"we,\" \"our,\" or \"us\"), you (\"Customer,\" \"you,\" or \"your\") agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws and regulations."
        },
        {
          "type": "p",
          "text": "If you do not agree to these Terms, you must discontinue use of our Website and Services. These Terms constitute a legally binding agreement between you and PrimeTime Peptides."
        }
      ]
    },
    {
      "heading": "2. Age & Eligibility",
      "blocks": [
        {
          "type": "p",
          "text": "You must be at least 18 years of age to access, browse, or purchase from this Website. By placing an order, you represent and warrant that:"
        },
        {
          "type": "li",
          "text": "You are at least 18 years of age"
        },
        {
          "type": "li",
          "text": "You are legally permitted to purchase research materials in your jurisdiction"
        },
        {
          "type": "li",
          "text": "Products will be used strictly for lawful in vitro laboratory research purposes only"
        },
        {
          "type": "li",
          "text": "Products will not be used for human consumption or veterinary purposes"
        },
        {
          "type": "li",
          "text": "You have read and agree to these Terms in full"
        },
        {
          "type": "p",
          "text": "We reserve the right to refuse service or cancel orders at our sole discretion."
        }
      ]
    },
    {
      "heading": "3. Research Use Only — Mandatory Acknowledgment",
      "blocks": [
        {
          "type": "p",
          "text": "ALL PRODUCTS SOLD BY PRIMETIME PEPTIDES ARE STRICTLY FOR IN VITRO LABORATORY RESEARCH USE ONLY."
        },
        {
          "type": "p",
          "text": "By purchasing, you acknowledge and agree that:"
        },
        {
          "type": "li",
          "text": "Products are designated \"For Research Use Only\" (RUO)"
        },
        {
          "type": "li",
          "text": "Products are NOT for human consumption"
        },
        {
          "type": "li",
          "text": "Products are NOT for veterinary use"
        },
        {
          "type": "li",
          "text": "Products are NOT intended to diagnose, treat, cure, or prevent disease"
        }
      ]
    },
    {
      "heading": "4. Prohibited Uses",
      "blocks": [
        {
          "type": "li",
          "text": "Use or consume any product personally"
        },
        {
          "type": "li",
          "text": "Administer products to humans or animals"
        },
        {
          "type": "li",
          "text": "Resell products with therapeutic claims"
        },
        {
          "type": "li",
          "text": "Represent products for medical or veterinary use"
        },
        {
          "type": "li",
          "text": "Provide products to minors"
        },
        {
          "type": "li",
          "text": "Use products in violation of any law"
        },
        {
          "type": "p",
          "text": "Violations may result in account termination and possible reporting to authorities."
        }
      ]
    },
    {
      "heading": "5. Limitation of Liability",
      "blocks": [
        {
          "type": "p",
          "text": "TO THE MAXIMUM EXTENT PERMITTED BY LAW, PRIMETIME PEPTIDES SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM THE PURCHASE OR USE OF PRODUCTS."
        },
        {
          "type": "p",
          "text": "Risk transfers to the buyer once the order is delivered to the shipping carrier. Total liability shall not exceed the amount paid for the specific order."
        }
      ]
    },
    {
      "heading": "6. Assumption of Risk",
      "blocks": [
        {
          "type": "p",
          "text": "You acknowledge that research chemicals and peptides may pose risks if improperly handled. You assume all risks associated with purchase, storage, and use."
        }
      ]
    },
    {
      "heading": "7. Order Processing & Shipping",
      "blocks": [
        {
          "type": "li",
          "text": "Orders are processed within one (1) business day"
        },
        {
          "type": "li",
          "text": "Orders cannot be modified once shipped"
        },
        {
          "type": "li",
          "text": "Delivery estimates are not guaranteed"
        },
        {
          "type": "li",
          "text": "We are not responsible for carrier delays or lost/stolen packages"
        },
        {
          "type": "li",
          "text": "Customers must provide accurate shipping information"
        },
        {
          "type": "li",
          "text": "Risk transfers once shipped"
        },
        {
          "type": "li",
          "text": "We ship within the United States unless otherwise stated"
        }
      ]
    },
    {
      "heading": "8. No Returns / No Refunds",
      "blocks": [
        {
          "type": "p",
          "text": "All sales are final."
        },
        {
          "type": "p",
          "text": "No returns, refunds, or exchanges are accepted once processed or shipped."
        },
        {
          "type": "p",
          "text": "Exception — Purity Guarantee: If valid third-party lab testing proves a product does not meet its Certificate of Analysis (COA) purity specifications, we may issue a replacement or refund at our discretion within 30 days of delivery."
        },
        {
          "type": "p",
          "text": "Damaged shipments must be reported within 48 hours at support@ptresearch.shop with photo evidence."
        }
      ]
    },
    {
      "heading": "9. Pricing & Payments",
      "blocks": [
        {
          "type": "li",
          "text": "Prices are in USD unless stated otherwise"
        },
        {
          "type": "li",
          "text": "We may adjust pricing without notice"
        },
        {
          "type": "li",
          "text": "Payments are securely processed via third-party gateways"
        },
        {
          "type": "li",
          "text": "We do not store full payment credentials"
        },
        {
          "type": "li",
          "text": "Customers are responsible for taxes and bank fees"
        }
      ]
    },
    {
      "heading": "10. Chargebacks & Payment Disputes",
      "blocks": [
        {
          "type": "p",
          "text": "Customers must contact contact@primetimeresearch.info before initiating a chargeback and allow five (5) business days for resolution."
        },
        {
          "type": "p",
          "text": "Improper chargebacks may result in account suspension and recovery of associated costs."
        }
      ]
    },
    {
      "heading": "11. Intellectual Property",
      "blocks": [
        {
          "type": "p",
          "text": "All website content, branding, logos, product descriptions, graphics, and code are the exclusive property of PrimeTime Peptides and protected by U.S. intellectual property laws. No content may be reproduced without written consent."
        }
      ]
    },
    {
      "heading": "12. Third-Party Services",
      "blocks": [
        {
          "type": "p",
          "text": "We utilize third-party providers such as payment processors and shipping carriers. We are not responsible for their policies or actions."
        }
      ]
    },
    {
      "heading": "13. Indemnification",
      "blocks": [
        {
          "type": "p",
          "text": "You agree to indemnify and hold harmless PrimeTime Peptides and its affiliates from any claims arising from your purchase or misuse of products or violation of these Terms."
        }
      ]
    },
    {
      "heading": "14. Dispute Resolution & Arbitration",
      "blocks": [
        {
          "type": "p",
          "text": "These Terms are governed by the laws of the State of Wyoming."
        },
        {
          "type": "p",
          "text": "All disputes shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) in Wyoming. Class actions are waived. Either party may bring eligible claims in small claims court."
        }
      ]
    },
    {
      "heading": "15. Severability",
      "blocks": [
        {
          "type": "p",
          "text": "If any provision is found unenforceable, the remaining provisions remain in full effect."
        }
      ]
    },
    {
      "heading": "16. Entire Agreement",
      "blocks": [
        {
          "type": "p",
          "text": "These Terms and our Privacy Policy constitute the entire agreement between you and PrimeTime Peptides."
        }
      ]
    },
    {
      "heading": "17. Waiver",
      "blocks": [
        {
          "type": "p",
          "text": "Failure to enforce any provision does not constitute waiver of that provision."
        }
      ]
    },
    {
      "heading": "18. Force Majeure",
      "blocks": [
        {
          "type": "p",
          "text": "We are not liable for delays or failures due to events beyond our control, including natural disasters, government actions, supply chain disruptions, or cyberattacks."
        }
      ]
    },
    {
      "heading": "19. Changes to Terms",
      "blocks": [
        {
          "type": "p",
          "text": "We reserve the right to modify these Terms at any time. Continued use constitutes acceptance of updated Terms."
        }
      ]
    },
    {
      "heading": "20. Contact Information",
      "blocks": [
        {
          "type": "p",
          "text": "PrimeTime Peptides"
        },
        {
          "type": "p",
          "text": "Email: contact@primetimeresearch.info"
        },
        {
          "type": "p",
          "text": "For legal correspondence, use subject line “Legal Notice.”"
        }
      ]
    }
  ],
};

export const termsHtmlSections: LegalSection[] = termsPage.sections;

// ── Privacy Policy (/privacy-policy-2/) ─────────────────────────────────────
export const privacyPage: LegalDocumentCopy = {
  title: 'Privacy Policy',
  metaTitle: 'Privacy Policy',
  entity: 'PrimeTime Peptides',
  lastUpdated: 'Last Updated: February 22, 2026',
  sections: [
    {
      "heading": "1. Introduction",
      "blocks": [
        {
          "type": "p",
          "text": "PrimeTime Peptides (\"PrimeTime Peptides,\" \"Company,\" \"we,\" \"us,\" or \"our\") is committed to protecting your privacy and safeguarding your personal information."
        },
        {
          "type": "p",
          "text": "This Privacy Policy explains how we collect, use, disclose, retain, and protect your information when you visit our website (primetimepeptides.com), purchase products, or otherwise interact with our services (collectively, the \"Services\")."
        },
        {
          "type": "p",
          "text": "By accessing our Website or using our Services, you consent to the practices described in this Privacy Policy. If you do not agree, you must discontinue use of our Services."
        }
      ]
    },
    {
      "heading": "2. Information We Collect",
      "blocks": [
        {
          "type": "subheading",
          "text": "Personal Information (Provided by You)"
        },
        {
          "type": "li",
          "text": "Full name"
        },
        {
          "type": "li",
          "text": "Email address"
        },
        {
          "type": "li",
          "text": "Phone number"
        },
        {
          "type": "li",
          "text": "Billing address"
        },
        {
          "type": "li",
          "text": "Shipping address"
        },
        {
          "type": "li",
          "text": "Date of birth (if required)"
        },
        {
          "type": "li",
          "text": "Order history and transaction records"
        },
        {
          "type": "li",
          "text": "Customer support communications"
        },
        {
          "type": "subheading",
          "text": "Payment Information"
        },
        {
          "type": "p",
          "text": "Payments are securely processed through trusted third-party payment gateways. PrimeTime Peptides does not collect or store full credit card or banking details. All payment data is handled in accordance with PCI DSS standards."
        },
        {
          "type": "subheading",
          "text": "Technical and Usage Data"
        },
        {
          "type": "li",
          "text": "IP address"
        },
        {
          "type": "li",
          "text": "Browser type and version"
        },
        {
          "type": "li",
          "text": "Operating system"
        },
        {
          "type": "li",
          "text": "Device type"
        },
        {
          "type": "li",
          "text": "Pages visited and time spent"
        },
        {
          "type": "li",
          "text": "Referring website"
        },
        {
          "type": "li",
          "text": "Session and navigation data"
        },
        {
          "type": "li",
          "text": "Cookies and tracking technologies"
        }
      ]
    },
    {
      "heading": "3. How We Use Your Information",
      "blocks": [
        {
          "type": "li",
          "text": "Process and deliver orders"
        },
        {
          "type": "li",
          "text": "Provide customer support"
        },
        {
          "type": "li",
          "text": "Verify identity and age eligibility"
        },
        {
          "type": "li",
          "text": "Prevent fraud and unauthorized transactions"
        },
        {
          "type": "li",
          "text": "Improve website performance"
        },
        {
          "type": "li",
          "text": "Ensure website security"
        },
        {
          "type": "li",
          "text": "Comply with legal obligations"
        },
        {
          "type": "li",
          "text": "Send promotional emails (opt-in only)"
        },
        {
          "type": "li",
          "text": "Resolve disputes and enforce Terms"
        },
        {
          "type": "p",
          "text": "We do not sell or rent your personal information."
        }
      ]
    },
    {
      "heading": "4. How We Share Information",
      "blocks": [
        {
          "type": "subheading",
          "text": "Service Providers"
        },
        {
          "type": "li",
          "text": "Payment processors"
        },
        {
          "type": "li",
          "text": "Shipping carriers"
        },
        {
          "type": "li",
          "text": "Hosting providers"
        },
        {
          "type": "li",
          "text": "Analytics services"
        },
        {
          "type": "li",
          "text": "Fraud prevention partners"
        },
        {
          "type": "li",
          "text": "Email service providers"
        },
        {
          "type": "subheading",
          "text": "Legal Compliance"
        },
        {
          "type": "p",
          "text": "We may disclose information when required by law or to protect our rights, property, customers, or the public."
        },
        {
          "type": "subheading",
          "text": "Business Transfers"
        },
        {
          "type": "p",
          "text": "In the event of a merger, acquisition, or sale of assets, your information may be transferred to a successor entity."
        }
      ]
    },
    {
      "heading": "5. Data Security",
      "blocks": [
        {
          "type": "li",
          "text": "SSL/TLS encryption"
        },
        {
          "type": "li",
          "text": "PCI DSS-compliant payment processors"
        },
        {
          "type": "li",
          "text": "Restricted employee access"
        },
        {
          "type": "li",
          "text": "Regular security assessments"
        },
        {
          "type": "p",
          "text": "While we implement strong safeguards, no online system is 100% secure."
        }
      ]
    },
    {
      "heading": "6. Data Retention",
      "blocks": [
        {
          "type": "p",
          "text": "We retain personal information only as long as necessary to fulfill transactions, comply with legal requirements, prevent fraud, resolve disputes, and enforce agreements. Data is securely deleted or anonymized when no longer needed."
        }
      ]
    },
    {
      "heading": "7. Cookies and Tracking Technologies",
      "blocks": [
        {
          "type": "p",
          "text": "We use cookies and similar technologies to:"
        },
        {
          "type": "li",
          "text": "Enable shopping cart functionality"
        },
        {
          "type": "li",
          "text": "Personalize your experience"
        },
        {
          "type": "li",
          "text": "Analyze website traffic"
        },
        {
          "type": "li",
          "text": "Remember preferences"
        },
        {
          "type": "li",
          "text": "Support marketing (if applicable)"
        },
        {
          "type": "p",
          "text": "You can manage cookies through your browser settings. Learn more at www.allaboutcookies.org."
        }
      ]
    },
    {
      "heading": "8. Your Privacy Rights",
      "blocks": [
        {
          "type": "subheading",
          "text": "All Customers"
        },
        {
          "type": "li",
          "text": "Access your data"
        },
        {
          "type": "li",
          "text": "Correct inaccurate data"
        },
        {
          "type": "li",
          "text": "Request deletion (subject to legal limits)"
        },
        {
          "type": "li",
          "text": "Opt out of marketing emails"
        },
        {
          "type": "subheading",
          "text": "Nevada Residents"
        },
        {
          "type": "p",
          "text": "Nevada residents may submit verified requests directing us not to sell their personal information (we do not currently sell personal information). Email contact@primetimeresearch.info."
        },
        {
          "type": "subheading",
          "text": "State-Specific Rights"
        },
        {
          "type": "p",
          "text": "Residents of states with applicable privacy laws may have rights to know, delete, or opt out of sale/sharing of personal information. We do not sell personal information."
        },
        {
          "type": "subheading",
          "text": "International Users"
        },
        {
          "type": "p",
          "text": "Users in the EEA, UK, or other regions may have additional rights including data portability and restriction of processing."
        }
      ]
    },
    {
      "heading": "9. Children's Privacy",
      "blocks": [
        {
          "type": "p",
          "text": "Our Services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from minors."
        }
      ]
    },
    {
      "heading": "10. International Data Transfers",
      "blocks": [
        {
          "type": "p",
          "text": "Information may be transferred to and processed in the United States. By using our Services, you consent to such transfers."
        }
      ]
    },
    {
      "heading": "11. Third-Party Links",
      "blocks": [
        {
          "type": "p",
          "text": "We are not responsible for privacy practices of third-party websites linked from our Website."
        }
      ]
    },
    {
      "heading": "12. Updates to This Policy",
      "blocks": [
        {
          "type": "p",
          "text": "We may update this Privacy Policy at any time. Changes are effective upon posting with an updated “Last Updated” date."
        }
      ]
    },
    {
      "heading": "13. Contact Information",
      "blocks": [
        {
          "type": "p",
          "text": "PrimeTime Peptides"
        },
        {
          "type": "p",
          "text": "Email: contact@primetimeresearch.info"
        },
        {
          "type": "p",
          "text": "For privacy-related requests, email us with the subject line “Privacy Request.”"
        }
      ]
    }
  ],
};

export const privacySections: LegalSection[] = privacyPage.sections;

// ── Affiliates ──────────────────────────────────────────────────────────────
// Both live pages are plugin dashboards (Coupon Affiliates) with no prose; the
// only copy is the page title and the PT25 promo banner (brandConfig.promos).
export const affiliatePages = {
  dashboardTitle: 'Affiliate Dashboard',
  registrationTitle: 'Affiliate Registration',
};

// ── 404 ─────────────────────────────────────────────────────────────────────
export const notFoundPage = {
  metaTitle: 'Page Not Found',
  heading: 'The page can’t be found.',
  body: 'It looks like nothing was found at this location.',
};

// ── Digital gift card (/gift-card, live /digtal-gift-card/) ─────────────────
// The live page ships its own UI: an Elementor HTML widget whose script
// replaces the Advanced Gift Cards plugin's <select>/radio form with an amount
// SLIDER, a custom-amount toggle, a two-button audience switch and a fixed
// bottom bar, then hides WooCommerce's gallery, tabs, related row and the
// plugin's own #ptgc-redeem section. Every string below is that UI's, verbatim
// (harvested from the live page 2026-09-21), including its curly apostrophes
// and the arrow on the claim link.
//
// The plugin labels the script keeps ("Recipient's Name*") carry live's own
// straight apostrophes and asterisks. The amounts and custom-amount bounds the
// messages quote are data, not copy — content/gift-card.ts.
export const giftCardCopy = {
  /** Live header spelling. The redesign header uses redesignChrome.nav.giftCard. */
  navLabel: 'Digtal Gift Card',
  metaTitle: 'Digital Gift Card',
  description: 'A PT Research gift card gives them the freedom to choose. Select a dollar balance, add a personal message, and send it by email now or on a date you choose.',
  eyebrow: 'Gift card / Delivered digitally',
  stageNote: 'Digital · delivered by email',

  // Amount: the big figure, the slider and its ticks, the custom-amount toggle.
  balance: 'balance',
  rangeLabel: 'Gift card amount',
  ticksLabel: 'Gift card amounts',
  /** Live builds each tick's label as "$25 gift card". */
  tickLabel: (amount: string) => `${amount} gift card`,
  customToggle: 'or enter an exact amount',
  customAmountLabel: 'Custom amount ($25–$1,000)',

  // Audience switch.
  modesLabel: 'Who is this for?',
  sendAsGift: 'Send as a gift',
  forMe: 'This one’s for me',

  // Recipient fields. The two starred labels are the plugin's own.
  recipientNameLabel: "Recipient's Name*",
  recipientNamePlaceholder: 'Dr. Alex Mercer',
  fromLabel: 'From',
  fromPlaceholder: 'Your name',
  recipientEmailLabel: "Recipient's Email*",
  recipientEmailPlaceholder: 'alex@lab.org',
  confirmEmailLabel: 'Confirm their email',
  confirmEmailHint: 'Please enter the recipient’s email again to check it is correct.',
  emailMismatch: 'The email addresses must match.',
  messageLabel: 'Message (optional)',
  messagePlaceholder: 'For the next round of assays. Pick something good.',
  sendOnLabel: 'Send on (optional)',
  sendOnHint: 'Leave blank to send as soon as the order is paid. Scheduled delivery uses your local time.',
  /** Live appends the sender to the message on submit as "From: <name>". */
  messageFromPrefix: 'From: ',

  /** Live retitles Add to cart with the running amount. */
  addToCart: (amount: string) => `Add gift card to cart · ${amount}`,

  assurances: ['Never expires', 'No fees', 'Secure account claim'],

  // The claim card that replaces the plugin's hidden redeem section.
  claimHeading: 'Already have a gift card?',
  claimLink: 'Add it to your account →',
  claimNote: 'Gift card purchases are final sale and non-refundable.',

  // The fixed bottom bar.
  stickyLabel: 'Gift card',
  stickyAdd: 'Add to cart',
  stickyTicksLabel: 'Quick gift card amounts',

  /**
   * Custom-amount validation, in the plugin's order. Live ships these as
   * printf templates ("Amount must be at least %s."); the bound is formatted
   * by content/gift-card.ts → formatBound ("$25", not "$25.00").
   */
  amountErrors: {
    empty: 'Please enter an amount.',
    nonNumeric: 'Please enter a valid amount.',
    belowMin: (bound: string) => `Amount must be at least ${bound}.`,
    aboveMax: (bound: string) => `Amount must not exceed ${bound}.`,
    offStep: (bound: string) => `Amount must be in increments of ${bound}.`,
  },
};

// ── Live pages with no Next.js route yet ────────────────────────────────────
// /50offfeedback/ (anonymous feedback form that reveals a discount code).
export const discountFeedbackCopy = {
  heading: 'This feedback form is completely anonymous. Your 50% discount code will appear right after submission.',
  questions: [
    'What stopped you from completing your order?',
    'What could we improve to make you feel comfortable completing your purchase?',
  ],
  submit: 'Submit Form',
};
