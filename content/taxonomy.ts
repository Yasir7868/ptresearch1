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
  /** One-sentence description of the research field, lab-framed. */
  blurb: string;
}

/**
 * The 8 categories, in display order. Each is named for the RESEARCH FIELD or
 * mechanism a compound is studied in, never for an effect on a person (no
 * healing, longevity, cosmetic or nootropic framing): every product is sold
 * for laboratory research only. Renamed 2026-09-19 at the owner's request;
 * the old slugs were healing-recovery, metabolic-glp, gh-secretagogues,
 * nootropic-neuro, longevity-cellular, cosmetic-pigmentation and
 * blends-stacks. (Growth Factors was retired 2026-07-21 — the store removed
 * IGF-1, IGF-DES and Follistatin.)
 */
export const CATEGORIES: readonly Category[] = [
  {
    slug: "tissue-regeneration-research",
    name: "Tissue Regeneration Research",
    blurb:
      "Peptides studied in laboratory models of tissue repair, angiogenesis, and cell migration.",
  },
  {
    slug: "metabolic-research",
    name: "Metabolic Research",
    blurb:
      "Incretin-receptor and metabolic compounds for laboratory studies of glucose signaling, energy pathways, and receptor pharmacology.",
  },
  {
    slug: "endocrine-research",
    name: "Endocrine Research",
    blurb:
      "GHRH analogues and secretagogues used to study pituitary signaling and hormone-release dynamics in laboratory models.",
  },
  {
    slug: "neuropeptide-research",
    name: "Neuropeptide Research",
    blurb:
      "Neuroactive peptides studied in laboratory models of neuronal signaling and sleep regulation.",
  },
  {
    slug: "cellular-mitochondrial-research",
    name: "Cellular & Mitochondrial Research",
    blurb:
      "Compounds studied in vitro for cellular energetics, redox balance, and mitochondrial function.",
  },
  {
    slug: "melanocortin-dermal-research",
    name: "Melanocortin & Dermal Research",
    blurb:
      "Melanocortin-receptor and copper-peptide compounds studied in laboratory models of melanogenesis and dermal tissue.",
  },
  {
    slug: "research-blends",
    name: "Multi-Peptide Research Blends",
    blurb:
      "Research blends combining complementary compounds in a single lyophilized preparation.",
  },
  {
    slug: "lab-supplies",
    name: "Laboratory Supplies",
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
  // --- Tissue Regeneration Research ---
  "bpc-157-premium-research-peptide-lab-grade-peptide": { primary: "tissue-regeneration-research" }, // BPC-157
  "tb-500-premium-research-peptide": { primary: "tissue-regeneration-research" }, // TB-500
  "ghk-cu-premium-research-peptide": {
    primary: "tissue-regeneration-research",
    secondary: ["melanocortin-dermal-research"],
  }, // GHK-Cu
  "vip-premium-research-peptide-lab-grade-peptide": { primary: "tissue-regeneration-research" }, // VIP

  // --- Metabolic Research ---
  "sema-glp-1-analog-research-grade-premium-research-peptide": { primary: "metabolic-research" }, // GLP1-SM
  "tr-2": { primary: "metabolic-research" }, // GLP2-TZ
  "rt": { primary: "metabolic-research" }, // GLP3-RT
  "mots-c-premium-research-peptide-lab-grade-peptide": { primary: "metabolic-research" }, // MOTS-C

  // --- Endocrine Research ---
  "tesamorelin-premium-research-peptides": { primary: "endocrine-research" }, // Tesamorelin
  "ipamorelin-premium-research-peptide-lab-grade": { primary: "endocrine-research" }, // Ipamorelin
  "cjc-ipamorelin-blend-premium-peptide-set-lab-grade-peptides": {
    primary: "endocrine-research",
    secondary: ["research-blends"],
  }, // CJC-Ipamorelin

  // --- Neuropeptide Research ---
  "semax-premium-research-peptide-lab-grade-peptide": { primary: "neuropeptide-research" }, // Semax
  "mots-c-premium-research-lab-grade-peptide-for-research": { primary: "neuropeptide-research" }, // Selank (misleading slug — verified by id 643)
  "dsip-premium-research-peptide-lab-grade-peptide": { primary: "neuropeptide-research" }, // DSIP

  // --- Cellular & Mitochondrial Research ---
  "nad-premium-research-compound-lab-grade": { primary: "cellular-mitochondrial-research" }, // NAD+
  "glutathione-premium-research-peptide-lab-grade": { primary: "cellular-mitochondrial-research" }, // Glutathione

  // --- Melanocortin & Dermal Research ---
  // Slug unchanged ("melanotan-1-…", id 629) but the live display name is now
  // "Melanotan II" — categorization is by SLUG, so the mapping holds.
  "melanotan-1-premium-research-peptide-lab-grade-peptide": { primary: "melanocortin-dermal-research" }, // Melanotan II

  // --- Multi-Peptide Research Blends ---
  "glow-blend-premium-research-peptides": { primary: "research-blends" }, // Glow Blend (BPC-157/TB-500/GHK-Cu)
  "klow-blend-premium-research-compound-lab-grade": { primary: "research-blends" }, // Klow Blend (KPV/BPC-157/TB-500/GHK-Cu)
  "bpc-157-tb-500-premium-research-peptide-set-lab-grade": { primary: "research-blends" }, // BPC-157 + TB-500 Combo

  // --- Laboratory Supplies ---
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
