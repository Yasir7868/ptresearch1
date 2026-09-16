/**
 * lib/woo/mapper.ts — WooCommerce Store API -> internal Product model.
 *
 * PURE + PORTABLE. This module has NO runtime dependencies: types are imported
 * type-only (erased at compile time), all HTML parsing is hand-rolled with
 * regex (no new packages), and there is zero dynamic IO — the only data import
 * is the static JSON manifest of local vial images (a JSON module with an
 * import attribute, supported by both Turbopack and plain Node 22). That lets
 * it run identically inside Next server code (lib/woo/catalog.ts) and in a
 * plain Node script (scripts/data-check.mjs) via native TS type-stripping.
 *
 * ── GLP compound coding rule (HARD RULE, see PRODUCT.md) ────────────────────
 * GLP trade names are NEVER written expanded anywhere. The product whose live
 * name starts "Sema" is ALWAYS displayed/stored as "GLP1-SM"; "GLP-2-TZ" is
 * normalized to "GLP2-TZ"; "GLP3-RT" stays. This is enforced by
 * DISPLAY_NAME_OVERRIDES (keyed by product id) plus a defensive guard that
 * re-codes any name still starting "Sema" even if the id drifts.
 */

import type {
  StoreApiProduct,
  StoreApiImage,
  Product,
  ProductVariation,
  ProductImage,
  FaqItem,
  CoaMap,
  CoaEntry,
} from "./types";
import localVialManifest from "../../content/product-images.json" with { type: "json" };

// ---------------------------------------------------------------------------
// Local studio vial images (content/product-images.json)
// ---------------------------------------------------------------------------

/**
 * slug -> local public path ("/product-vials/<slug>.webp") for products whose
 * navy-branded studio vial shot exists in public/product-vials/. When present,
 * the local image is PREPENDED as images[0] (card + PDP primary) and the Woo
 * images follow (the PDP thumb strip keeps the true-color originals). Missing
 * slugs gracefully fall back to Woo images alone. Local filenames are coded
 * (slug-derived), so the EXPANDED_GLP_RE filter below applies to Woo images
 * only — it never needs to inspect local paths.
 */
const LOCAL_VIALS: Record<string, string> = localVialManifest;

// ---------------------------------------------------------------------------
// GLP display-name coding (HARD RULE)
// ---------------------------------------------------------------------------

/**
 * Product-id -> forced display name. The canonical enforcement of the GLP
 * coding rule. Ids verified against the live Store API on 2026-07-14.
 *   1022 = the "Sema …" GLP-1 analog  -> GLP1-SM
 *    638 = live name "GLP-2-TZ"       -> GLP2-TZ (drop the hyphen)
 * (id 630 = "GLP3-RT" needs no override — it is already correct.)
 */
export const DISPLAY_NAME_OVERRIDES: Record<number, string> = {
  1022: "GLP1-SM",
  638: "GLP2-TZ",
};

/**
 * Expanded GLP names that must NEVER reach rendered output — not even inside
 * an asset URL. The live store hosts certificate JPEGs whose *filenames*
 * carry expanded names (e.g. "PTR-…-P-Retatrutide-purity-pdf.jpg"); those
 * URLs would otherwise leak into PDP gallery srcsets and catalog flight data.
 * Any image whose src or alt matches is dropped at map time (every GLP
 * product keeps its coded primary image, so nothing renders empty).
 */
const EXPANDED_GLP_RE =
  /semaglutide|tirzepatide|retatrutide|ozempic|wegovy|mounjaro|zepbound|rybelsus|saxenda/i;

/** Trailing marketing suffixes to strip from product names. "(USP Grade)" stays. */
const NAME_SUFFIX_RE =
  /\s*[–—-]\s*Premium Research (?:Peptide Set|Peptides|Peptide|Compounds|Compound)\s*$/i;

/**
 * Produce the coded, cleaned display name for a product.
 * Order: id override -> defensive "Sema" guard -> suffix strip -> GLP-2 normalize.
 */
export function codeDisplayName(id: number, rawName: string): string {
  const override = DISPLAY_NAME_OVERRIDES[id];
  if (override) return override;

  const name = rawName.trim();

  // Defensive: never emit an expanded "Sema…" trade name, even on id drift.
  if (/^sema\b/i.test(name)) return "GLP1-SM";

  let cleaned = name.replace(NAME_SUFFIX_RE, "").trim();

  // Normalize any stray "GLP-2-TZ" -> "GLP2-TZ".
  cleaned = cleaned.replace(/\bGLP-2-TZ\b/g, "GLP2-TZ");

  return cleaned;
}

// ---------------------------------------------------------------------------
// HTML helpers (dependency-free)
// ---------------------------------------------------------------------------

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  trade: "™",
  reg: "®",
  copy: "©",
  deg: "°",
};

/** Decode HTML entities (named + decimal + hex). Unknown entities pass through. */
export function decodeEntities(input: string): string {
  return input.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1] === "x" || code[1] === "X";
      const num = isHex ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      if (Number.isFinite(num) && num > 0) {
        try {
          return String.fromCodePoint(num);
        } catch {
          return match;
        }
      }
      return match;
    }
    return NAMED_ENTITIES[code] ?? NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Strip all tags, decode entities, collapse whitespace. */
function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Return the inner HTML of every <li> in the given fragment. */
function listItemInners(html: string): string[] {
  const out: string[] = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1] ?? "");
  return out;
}

/** Return the inner HTML of every <p> in the given fragment. */
function paragraphInners(html: string): string[] {
  const out: string[] = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1] ?? "");
  return out;
}

/**
 * The HTML fragment of a description section, located by its <h2> heading and
 * bounded by the next <h2> (or end of string). Robust to missing sections.
 */
function sectionContent(html: string, heading: string): string {
  const headingRe = new RegExp(`<h2\\b[^>]*>\\s*${heading}\\s*</h2>`, "i");
  const m = headingRe.exec(html);
  if (!m) return "";
  const rest = html.slice(m.index + m[0].length);
  const nextH2 = rest.search(/<h2\b[^>]*>/i);
  return nextH2 >= 0 ? rest.slice(0, nextH2) : rest;
}

// ---------------------------------------------------------------------------
// Field parsers
// ---------------------------------------------------------------------------

/**
 * Parse short_description into bullets. The live store is inconsistent: some
 * products use <ul><li>…, others a single <p>. Handle both; fall back to the
 * whole cleaned text as one bullet.
 */
export function parseBullets(shortDescription: string): string[] {
  if (!shortDescription) return [];

  const lis = listItemInners(shortDescription).map(cleanText).filter(Boolean);
  if (lis.length > 0) return lis;

  const ps = paragraphInners(shortDescription).map(cleanText).filter(Boolean);
  if (ps.length > 0) return ps;

  const whole = cleanText(shortDescription);
  return whole ? [whole] : [];
}

/**
 * Parse the description's `.rcl-extra-wrap` block into usage[] + faq[].
 * Missing sections yield empty arrays (no throw).
 */
export function parseUsageAndFaq(description: string): {
  usage: string[];
  faq: FaqItem[];
} {
  if (!description) return { usage: [], faq: [] };

  // Usage: a bullet list (fall back to paragraphs).
  const usageBlock = sectionContent(description, "Usage");
  let usage = listItemInners(usageBlock).map(cleanText).filter(Boolean);
  if (usage.length === 0) {
    usage = paragraphInners(usageBlock).map(cleanText).filter(Boolean);
  }

  // FAQ: each <li> is "<strong>Question?</strong> Answer".
  const faqBlock = sectionContent(description, "FAQ");
  const faq: FaqItem[] = [];
  for (const inner of listItemInners(faqBlock)) {
    const strongRe = /<strong\b[^>]*>([\s\S]*?)<\/strong>/i;
    const sm = strongRe.exec(inner);
    let q: string;
    let a: string;
    if (sm) {
      q = cleanText(sm[1] ?? "");
      a = cleanText(inner.slice(sm.index + sm[0].length));
    } else {
      const text = cleanText(inner);
      const qi = text.indexOf("?");
      if (qi >= 0) {
        q = text.slice(0, qi + 1).trim();
        a = text.slice(qi + 1).trim();
      } else {
        q = "";
        a = text;
      }
    }
    if (q || a) faq.push({ q, a });
  }

  return { usage, faq };
}

/** Normalize one Store API image; alt falls back to the display name. */
function mapImage(img: StoreApiImage, displayName: string): ProductImage {
  const alt = (img.alt ?? "").trim();
  return { src: img.src, alt: alt || displayName };
}

/** Parse a minor-unit price string ("4400") to an integer. NaN -> 0. */
function toMinor(value: string | undefined): number {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

/** Look up COA/purity enrichment by sku, then slug, then product id. */
function lookupCoa(coaMap: CoaMap | undefined, raw: StoreApiProduct): CoaEntry {
  if (!coaMap) return {};
  const direct = coaMap[raw.sku] ?? coaMap[raw.slug] ?? coaMap[String(raw.id)];
  if (direct) return direct;
  // Fallback: scan for a record whose productId field matches — some records
  // are keyed by a coded label (e.g. "GLP1-SM") rather than sku/slug.
  for (const [key, entry] of Object.entries(coaMap)) {
    if (key.startsWith("_")) continue; // _meta / _unmatched
    if (entry.productId === raw.id) return entry;
  }
  return {};
}

// ---------------------------------------------------------------------------
// mapProduct
// ---------------------------------------------------------------------------

/** Primary/secondary category assignment supplied by the caller (taxonomy). */
export interface CategoryInput {
  categorySlug: string;
  categoryName: string;
  secondarySlugs: string[];
}

export interface MapProductOptions {
  /** variationId -> priceMinor, from parallel getVariation() calls. */
  variationPrices?: Record<number, number>;
  /** Optional COA/purity enrichment (content/coa-map.json). */
  coaMap?: CoaMap;
  /** Category assignment from content/taxonomy.ts (categoryForSlug). */
  category?: CategoryInput;
}

/**
 * Map a Store API product to the internal Product model.
 *
 * `variationPrices` supplies per-variation prices for variable products (the
 * parent's `variations[]` only carries ids + size attributes). If a price is
 * missing it defaults to the parent's starting price so the UI never shows $0.
 */
export function mapProduct(
  raw: StoreApiProduct,
  options: MapProductOptions = {}
): Product {
  const { variationPrices, coaMap, category } = options;

  const displayName = codeDisplayName(raw.id, raw.name);
  const kind: "simple" | "variable" =
    raw.type === "variable" ? "variable" : "simple";
  const priceMinor = toMinor(raw.prices?.price);
  const currencyMinorUnit = raw.prices?.currency_minor_unit ?? 2;

  let variations: ProductVariation[] | undefined;
  if (kind === "variable" && Array.isArray(raw.variations) && raw.variations.length > 0) {
    variations = raw.variations.map((v) => {
      const size = v.attributes?.find((a) => /size/i.test(a.name))?.value ?? "";
      const vp = variationPrices?.[v.id];
      return {
        variationId: v.id,
        size,
        priceMinor: typeof vp === "number" ? vp : priceMinor,
      };
    });
  }

  const bullets = parseBullets(raw.short_description ?? "");
  const { usage, faq } = parseUsageAndFaq(raw.description ?? "");
  const images = (raw.images ?? [])
    .filter((img) => !EXPANDED_GLP_RE.test(`${img.src} ${img.alt ?? ""}`))
    .map((img) => mapImage(img, displayName));
  const localVial = LOCAL_VIALS[raw.slug];
  if (localVial) images.unshift({ src: localVial, alt: displayName });
  const coa = lookupCoa(coaMap, raw);

  const product: Product = {
    productId: raw.id,
    sku: raw.sku ?? "",
    slug: raw.slug,
    displayName,
    categorySlug: category?.categorySlug ?? "all-compounds",
    categoryName: category?.categoryName ?? "All Compounds",
    secondaryCategories: category?.secondarySlugs ?? [],
    kind,
    priceMinor,
    currencyMinorUnit,
    bullets,
    usage,
    faq,
    images,
    isInStock: Boolean(raw.is_in_stock),
    isPurchasable: Boolean(raw.is_purchasable),
  };

  if (variations && variations.length > 0) product.variations = variations;
  if (coa.purity) product.purity = coa.purity;
  if (coa.coaUrl) product.coaUrl = coa.coaUrl;

  return product;
}
