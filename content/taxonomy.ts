/**
 * content/taxonomy.ts — the site's own category system.
 *
 * The live WooCommerce store does NOT categorize products usefully (every
 * product is either uncategorized or in a junk "simple" category), so we
 * impose a clean 9-category taxonomy here, keyed by the product's live SLUG.
 *
 * SLUGS ARE VERIFIED against the live Store API (21 products, re-verified
 * 2026-07-21 after the store trimmed its catalog 28 -> 21) — they are exact,
 * not guessed. When the catalog is built
 * (lib/woo/catalog.ts) each product is assigned its primary category plus any
 * secondary categories. Any slug not present in PRODUCT_CATEGORY_MAP falls
 * back to the ALL_COMPOUNDS bucket and emits a console.warn so drift is loud.
 *
 * NOTE ON NAMES: a few live products carry misleading slugs (e.g. Selank ships
 * under a "mots-c-…" slug). Categorization is by SLUG regardless of the name,
 * so those are mapped deliberately — see the inline comments.
 */

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

export interface Category {
  slug: string;
  name: string;
  /** One-sentence clinical-tone description. */
  blurb: string;
}

/**
 * The 8 categories, in display order. Order is intentional: therapeutic
 * groupings first, blends and lab supplies last. (Growth Factors was retired
 * 2026-07-21 — the store removed all three of its products: IGF-1, IGF-DES,
 * Follistatin.)
 */
export const CATEGORIES: readonly Category[] = [
  {
    slug: "healing-recovery",
    name: "Healing & Recovery",
    blurb:
      "Peptides studied for tissue repair, angiogenesis, and regenerative response in laboratory models.",
  },
  {
    slug: "metabolic-glp",
    name: "Metabolic & GLP",
    blurb:
      "Incretin and metabolic research compounds investigated for glucose regulation, energy expenditure, and receptor pharmacology.",
  },
  {
    slug: "gh-secretagogues",
    name: "GH Secretagogues",
    blurb:
      "GHRH analogues and growth-hormone secretagogues used to study pituitary GH secretion dynamics.",
  },
  {
    slug: "nootropic-neuro",
    name: "Nootropic & Neuro",
    blurb:
      "Neuroactive peptides examined for effects on cognition, neuroprotection, and sleep architecture in research settings.",
  },
  {
    slug: "longevity-cellular",
    name: "Longevity & Cellular",
    blurb:
      "Compounds studied for cellular energetics, redox balance, and aging-related pathways.",
  },
  {
    slug: "cosmetic-pigmentation",
    name: "Cosmetic & Pigmentation",
    blurb:
      "Melanocortin and copper-peptide compounds researched for pigmentation and dermal applications.",
  },
  {
    slug: "blends-stacks",
    name: "Blends & Stacks",
    blurb:
      "Multi-peptide research blends combining complementary compounds in a single lyophilized preparation.",
  },
  {
    slug: "lab-supplies",
    name: "Lab Supplies",
    blurb:
      "Reconstitution solvents and ancillary consumables for peptide research workflows.",
  },
] as const;

/**
 * Fallback bucket for any product slug not explicitly mapped. Not part of the
 * ordered CATEGORIES list — it only surfaces when drift occurs.
 */
export const ALL_COMPOUNDS: Category = {
  slug: "all-compounds",
  name: "All Compounds",
  blurb: "The complete Primetime Research catalog.",
};

/** Fast lookup: category slug -> Category. */
const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  [...CATEGORIES, ALL_COMPOUNDS].map((c) => [c.slug, c])
);

// ---------------------------------------------------------------------------
// Product slug -> category assignment
// ---------------------------------------------------------------------------

interface Assignment {
  /** Primary category slug. */
  primary: string;
  /** Secondary category slugs (product also appears under these). */
  secondary?: string[];
}

/**
 * Every one of the 21 live product slugs is mapped here. Re-verified against
 * the live Store API on 2026-07-21 (7 discontinued products removed:
 * Sermorelin, Epitalon, Follistatin, IGF-1, IGF-DES, AOD-9604, SLU-PP-332).
 * Comments note the human-readable product.
 */
export const PRODUCT_CATEGORY_MAP: Record<string, Assignment> = {
  // --- Healing & Recovery ---
  "bpc-157-premium-research-peptide-lab-grade-peptide": { primary: "healing-recovery" }, // BPC-157
  "tb-500-premium-research-peptide": { primary: "healing-recovery" }, // TB-500
  "ghk-cu-premium-research-peptide": {
    primary: "healing-recovery",
    secondary: ["cosmetic-pigmentation"],
  }, // GHK-Cu
  "vip-premium-research-peptide-lab-grade-peptide": { primary: "healing-recovery" }, // VIP

  // --- Metabolic & GLP ---
  "sema-glp-1-analog-research-grade-premium-research-peptide": { primary: "metabolic-glp" }, // GLP1-SM
  "tr-2": { primary: "metabolic-glp" }, // GLP2-TZ
  "rt": { primary: "metabolic-glp" }, // GLP3-RT
  "mots-c-premium-research-peptide-lab-grade-peptide": { primary: "metabolic-glp" }, // MOTS-C

  // --- GH Secretagogues ---
  "tesamorelin-premium-research-peptides": { primary: "gh-secretagogues" }, // Tesamorelin
  "ipamorelin-premium-research-peptide-lab-grade": { primary: "gh-secretagogues" }, // Ipamorelin
  "cjc-ipamorelin-blend-premium-peptide-set-lab-grade-peptides": {
    primary: "gh-secretagogues",
    secondary: ["blends-stacks"],
  }, // CJC-Ipamorelin

  // --- Nootropic & Neuro ---
  "semax-premium-research-peptide-lab-grade-peptide": { primary: "nootropic-neuro" }, // Semax
  "mots-c-premium-research-lab-grade-peptide-for-research": { primary: "nootropic-neuro" }, // Selank (misleading slug — verified by id 643)
  "dsip-premium-research-peptide-lab-grade-peptide": { primary: "nootropic-neuro" }, // DSIP

  // --- Longevity & Cellular ---
  "nad-premium-research-compound-lab-grade": { primary: "longevity-cellular" }, // NAD+
  "glutathione-premium-research-peptide-lab-grade": { primary: "longevity-cellular" }, // Glutathione

  // --- Cosmetic & Pigmentation ---
  // Slug unchanged ("melanotan-1-…", id 629) but the live display name is now
  // "Melanotan II" — categorization is by SLUG, so the mapping holds.
  "melanotan-1-premium-research-peptide-lab-grade-peptide": { primary: "cosmetic-pigmentation" }, // Melanotan II

  // --- Blends & Stacks ---
  "glow-blend-premium-research-peptides": { primary: "blends-stacks" }, // Glow Blend (BPC-157/TB-500/GHK-Cu)
  "klow-blend-premium-research-compound-lab-grade": { primary: "blends-stacks" }, // Klow Blend (KPV/BPC-157/TB-500/GHK-Cu)
  "bpc-157-tb-500-premium-research-peptide-set-lab-grade": { primary: "blends-stacks" }, // BPC-157 + TB-500 Combo

  // --- Lab Supplies ---
  "bacteriostatic-water-usp-grade": { primary: "lab-supplies" }, // Bacteriostatic Water (USP Grade)
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/** The resolved taxonomy for one product. */
export interface CategoryAssignment {
  /** Primary category. */
  primary: Category;
  /** Primary category slug (convenience). */
  categorySlug: string;
  /** Primary category display name (convenience). */
  categoryName: string;
  /** Resolved secondary categories. */
  secondary: Category[];
  /** Secondary category slugs (convenience). */
  secondarySlugs: string[];
}

/**
 * Resolve a product SLUG to its category assignment. Unmapped slugs fall back
 * to the ALL_COMPOUNDS bucket and emit a console.warn (loud drift signal).
 */
export function categoryForSlug(slug: string): CategoryAssignment {
  const assignment = PRODUCT_CATEGORY_MAP[slug];

  if (!assignment) {
    console.warn(
      `[taxonomy] unmapped product slug "${slug}" — falling back to "${ALL_COMPOUNDS.slug}"`
    );
    return {
      primary: ALL_COMPOUNDS,
      categorySlug: ALL_COMPOUNDS.slug,
      categoryName: ALL_COMPOUNDS.name,
      secondary: [],
      secondarySlugs: [],
    };
  }

  const primary = CATEGORY_BY_SLUG[assignment.primary] ?? ALL_COMPOUNDS;
  const secondarySlugs = assignment.secondary ?? [];
  const secondary = secondarySlugs
    .map((s) => CATEGORY_BY_SLUG[s])
    .filter((c): c is Category => Boolean(c));

  return {
    primary,
    categorySlug: primary.slug,
    categoryName: primary.name,
    secondary,
    secondarySlugs,
  };
}

/** Look up a Category by its own slug (not a product slug). */
export function getCategory(categorySlug: string): Category | undefined {
  return CATEGORY_BY_SLUG[categorySlug];
}

/** All product slugs that are explicitly mapped (for validation/tests). */
export function mappedProductSlugs(): string[] {
  return Object.keys(PRODUCT_CATEGORY_MAP);
}
