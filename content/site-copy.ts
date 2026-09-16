// content/site-copy.ts
// VERBATIM copy harvested from the LIVE client site https://ptresearch.shop (2026-07-14).
// Markup was stripped; wording is unchanged (no rewrites, no fixes) per intake rules.
// HARD RULE #1: GLP-compound trade names are never written expanded here; the site's own
// product names are already coded (GLP1-SM / GLP2-TZ display / GLP3-RT).
// Flags for the page builders are marked TODO_INTAKE.

export interface FaqItem { q: string; a: string; }
export interface LegalBlock { type: 'p' | 'li' | 'subheading'; text: string; }
export interface LegalSection { heading: string; blocks: LegalBlock[]; }
export interface TrustBadge { title: string; body: string; }
export interface Testimonial { quote: string; author: string; when: string; }
export interface StatItem { value: string; label: string; }

// ── FAQ ─────────────────────────────────────────────────────────────────────
// Verbatim from the live /faq/ page (9 items).
export const faqItems: FaqItem[] = [
  {
    "q": "What are peptides?",
    "a": "Peptides are short chains of amino acids linked by peptide bonds. They are smaller than proteins and serve as important research tools for studying biological processes, protein interactions, and cellular mechanisms.\n\nThey are not intended for human or veterinary use and are typically used in preclinical experiments, academic studies, or product development testing."
  },
  {
    "q": "Who can purchase from Primetime Peptides?",
    "a": "This product is only available to researchers only."
  },
  {
    "q": "What purity levels do you guarantee?",
    "a": "All our peptides are manufactured to a minimum purity of 99%. Each product is tested using HPLC and Mass Spectrometry, with results documented in the Certificate of Analysis."
  },
  {
    "q": "Are your peptides third-party tested?",
    "a": "Yes. We use independent laboratories to verify our quality claims, ensuring unbiased confirmation of purity and identity for complete transparency."
  },
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
  },
  {
    "q": "What is your return policy?",
    "a": "Due to the nature of research materials, we cannot accept returns on opened or used products. If you receive a damaged or incorrect item, please contact us within 48 hours of delivery."
  },
  {
    "q": "How can I track my order?",
    "a": "Once your order ships, you’ll receive a confirmation email with tracking information. You can also track your order status through your account dashboard or through our track your order page."
  }
];

// The live homepage carries a SEPARATE, shorter 5-item FAQ block (different wording
// from /faq/). Captured here for the builder to reconcile. TODO_INTAKE: decide which set is canonical.
export const homepageFaqItems: FaqItem[] = [
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
];

// ── Terms & Conditions ──────────────────────────────────────────────────────
// Verbatim from /terms-and-conditions/. Legal wording preserved exactly
// (18+, RUO / "For Research Use Only", in-vitro, Wyoming governing law, AAA arbitration).
export const termsHtmlSections: LegalSection[] = [
  {
    "heading": "1. Acceptance of Terms",
    "blocks": [
      {
        "type": "p",
        "text": "By accessing or using the PrimeTime Peptides website (primetimepeptides.com), purchasing products, or engaging with our services (\"Company,\" \"we,\" \"our,\" or \"us\"), you (\"Customer,\" \"you,\" or \"your\") agree to be bound by these Terms and Conditions, our Privacy Policy, and all applicable laws and regulations."
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
        "text": "Customers must contact support@ptresearch.shop before initiating a chargeback and allow five (5) business days for resolution."
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
        "text": "PrimeTime Peptides\n\nEmail: support@ptresearch.shop"
      },
      {
        "type": "p",
        "text": "For legal correspondence, use subject line “Legal Notice.”"
      }
    ]
  }
];

// ── Privacy Policy ──────────────────────────────────────────────────────────
// Verbatim from /privacy-policy-2/.
// TODO_INTAKE: the privacy policy references the OLD domain "primetimepeptides.com"
// and a different contact address (support@primetimepeptides.com) than the Terms
// (support@ptresearch.shop). Left verbatim; reconcile the canonical domain/inbox at intake.
export const privacySections: LegalSection[] = [
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
        "text": "Nevada residents may submit verified requests directing us not to sell their personal information (we do not currently sell personal information). Email support@primetimepeptides.com."
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
        "text": "PrimeTime Peptides\n\nEmail: support@primetimepeptides.com"
      },
      {
        "type": "p",
        "text": "For privacy-related requests, email us with the subject line “Privacy Request.”"
      }
    ]
  }
];

// ── Shipping policy ─────────────────────────────────────────────────────────
// TODO_INTAKE: the site is internally inconsistent about shipping speed.
//   - Homepage promo banner:  "2-Day Shipping"
//   - /faq/ answer:           "Standard shipping typically takes 2-4 business days within the U.S."
//   - Terms §7:               "Orders are processed within one (1) business day"
// Both customer-facing claims are included below; page builder must pick one after intake.
export const shippingPolicy = {
  bannerClaim: '2-Day Shipping',           // homepage promo strip (verbatim)
  freeShippingThreshold: 'Free Shipping $200+', // homepage promo strip (verbatim)
  faqClaim: 'Standard shipping typically takes 2-4 business days within the U.S.', // /faq/ (verbatim)
  processingTime: 'Orders are processed within one (1) business day', // Terms §7 (verbatim)
  coldChain: 'We use appropriate cold packs and insulated packaging for temperature-sensitive products. This cold chain approach ensures stability from our facility to your laboratory.', // /faq/ (verbatim)
  domesticOnly: 'We ship within the United States unless otherwise stated.', // Terms §7 (verbatim)
  // TODO_INTAKE: reconcile 2-Day vs 2-4 business days before publishing.
};

// ── Contact info ────────────────────────────────────────────────────────────
// supportEmail kept AS-IS per intake instruction (canonical inbox pending intake).
// TODO_INTAKE: the LIVE site is inconsistent — Terms shows support@ptresearch.shop,
// Privacy shows support@primetimepeptides.com. Confirm the canonical support inbox at intake.
export const contactInfo = {
  supportEmail: 'support@ptrsearch.shop',
  responsePromise: 'We typically respond within 24 hours during business days.',
};

// ── Hero copy (verbatim, live homepage) ─────────────────────────────────────
export const heroCopy = {
  eyebrow: 'HIGHEST QUALITY',
  heading: 'Premium-Grade Peptides',
  body: "At Primetime Research, we're committed to providing researchers with the highest quality peptides and peptide blends in the industry. Manufactured and compounded in the USA under strict quality standards. These products are for research use only and not intended for human or animal consumption, diagnostic use, or therapeutic application of any kind.",
  cta: 'View Catalog',
  trustHeading: 'Trusted by Researchers Worldwide',
  trustStat: '99%+ Purity',
  trustBody: 'Every batch is tested in certified facilities and documented with a Certificate of Analysis \u2014 uncompromising standards for research use.',
  trustCta: 'View COAs',
  marquee: 'PEPTIDES FOR RESEARCH \u25e6',
};

// ── About / brand block (verbatim, live homepage) ───────────────────────────
export const aboutCopy = {
  brand: 'Primetime Research',
  tagline: 'Where Innovation Meets Research Excellence',
  headingLead: 'Your trusted source for',
  headingEmphasis: 'high-purity peptides',
  // NOTE(copy-quality): the live line below uses the word "empower" (an anti-AI-voice word in
  // Sentravision's own guidelines). Kept VERBATIM as client copy; flag for optional rewrite at intake.
  body: 'At Primetime Research, we empower researchers with premium-grade peptides rigorously tested, consistently pure, and delivered fast. All products are intended strictly for laboratory research purposes only and are not for human consumption.',
  standardsLine: 'All peptides and compounds sold by Primetime Research are analytical-grade biochemical reference standards, manufactured and tested to strict purity and identity specifications for laboratory use.',
  assurance: 'Every batch is USA Based Labs verified for identity and purity. No exceptions. No shortcuts. Because your research depends on it and so does ours.',
  supplyLine: 'Our products are supplied exclusively for in-vitro research and analytical method development by qualified laboratory professionals and research institutions.',
};

// ── Trust badges (verbatim, live homepage) ──────────────────────────────────
export const trustBadges: TrustBadge[] = [
  { title: 'Research Use Only', body: 'All products are intended strictly for laboratory research not for human consumption, medical, or veterinary use' },
  { title: '3rd Party Tested', body: 'Every batch is tested for identity and purity through certified U.S.A. Based Labs.' },
  { title: 'Customer Services', body: 'Reach us anytime for real-time assistance and expert guidance.' },
  { title: 'Credit Cards Accepted', body: 'All transactions are encrypted and processed with top-tier security protocols.' },
];

// ── Stats (verbatim, live homepage) ─────────────────────────────────────────
export const stats: StatItem[] = [
  { value: 'Thousands', label: 'of satisfied researchers' },
  { value: '50+', label: 'States In Service' },
  { value: '99%', label: 'Pure Peptides' },
  { value: '12', label: 'Years of combined experience' },
];

// ── Promo strings (verbatim) ────────────────────────────────────────────────
// TODO_INTAKE: two different live promos are running simultaneously (homepage BOGO vs affiliate PT25).
export const promoStrings = {
  homepageBanner: {
    label: 'LIMITED OFFER',
    headline: 'Buy One Get One 50% Off',
    cta: 'Shop Now',
    fine: 'AUTO-APPLIED AT CHECKOUT \u2022 NO CODE NEEDED',
  },
  shippingStrip: '2-Day Shipping | Free Shipping $200+',
  announcement: 'FOR RESEARCH USE ONLY',
  affiliatePromo: { code: 'PT25', headline: '25% off all Research Compounds' }, // from /affiliates/ banner
};

// ── Age gate (verbatim, live homepage) ──────────────────────────────────────
// TODO_INTAKE: age gate says 21 here but Terms §2 and Privacy §9 both say 18. Legal inconsistency.
export const ageGate = {
  heading: 'TO ENTER THIS WEBSITE YOU MUST BE OVER 21 YEARS OLD',
  subtext: 'By entering this site, you are accepting our Terms and Conditions',
  confirmAge: 'I am 21 years of age or older.',
  confirmUse: 'I understand these products are for research use only and are not for human consumption.',
  roleOptions: ['Private Research', 'Academic Institution', 'Commercial Laboratory', 'Clinical Research'],
  acceptLabel: 'Accept',
  declineLabel: 'Decline',
};

// ── Compliance strings (verbatim) ───────────────────────────────────────────
export const complianceStrings = {
  homepageStrip: 'All products available on Primetime Research are strictly intended for laboratory research use only. They are not for human consumption, medical treatment, or veterinary use.',
  footerTagline: "At Prime research, we're committed to providing researchers with the highest quality peptides and peptide blends in the industry.", // NOTE: live footer lowercases "Prime research"
  footerCompliance: 'All products are sold for research, laboratory, or analytical purposes only, and are not for human consumption',
};

// ── Reviews widget (verbatim, live homepage) ────────────────────────────────
// NOTE(copy-quality): 771-review count + "X hours ago" timestamps read as auto-rotating social proof.
// Captured verbatim; builder should decide whether to carry this widget over.
export const reviews = {
  rating: 'Excellent',
  basis: 'Based on 771 Reviews',
  testimonials: [
    { quote: 'Peptides arrived fast and quality looks excellent.', author: 'Michael R.', when: '6 hours ago' },
    { quote: 'Ordered this week and it shipped the same day. Very impressed.', author: 'Jason T.', when: '9 hours ago' },
    { quote: 'Packaging was professional and products were exactly as described.', author: 'Daniel M.', when: '12 hours ago' },
    { quote: 'Quality looks great and everything arrived securely packaged.', author: 'Kevin D.', when: '21 hours ago' },
    { quote: 'Great experience overall. Fast delivery and good quality.', author: 'Anthony S.', when: '1 day ago' },
  ] as Testimonial[],
};

// ── Newsletter (verbatim, live homepage) ────────────────────────────────────
export const newsletter = {
  heading: 'Subscribe to our emails',
  body: 'Be the first to know about new collections and special offers.',
};

// ── Affiliate program ───────────────────────────────────────────────────────
// The live /affiliates/ page is a bare [couponaffiliates] dashboard shortcode (Coupon Affiliates
// plugin) with NO descriptive marketing blurb. Only the promo banner (PT25 / 25% off) carries copy.
export const affiliateProgram = {
  hasProgram: true,
  pageTitle: 'Affiliate Dashboard',
  blurb: null, // no prose blurb published on the live site
  promo: { code: 'PT25', headline: '25% off all Research Compounds' },
};
