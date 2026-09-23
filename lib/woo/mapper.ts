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
  RichParagraph,
  TextRun,
  VariationPrice,
} from "./types";

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

/** True when a string (name, note, image URL) carries an expanded GLP name. */
export function containsExpandedGlpName(value: string): boolean {
  return EXPANDED_GLP_RE.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a coder for FREE TEXT that comes back from WooCommerce — order notes
 * ("Stock levels reduced: <product> …"), order line names, customer notes —
 * which can carry raw live product names. Used by the admin panel.
 *
 * `catalog` is the live product list fetched at runtime, so no expanded name
 * is ever written in this repo: each GLP product's raw live name is replaced
 * with its coded display name, then any expanded trade name still left is
 * replaced with the coded name of the catalog product whose raw name contains
 * it, or a neutral "GLP compound".
 */
export function createGlpTextCoder(
  catalog: ReadonlyArray<{ id: number; name: string }>
): (text: string) => string {
  const pairs = catalog
    .map((p) => ({ id: p.id, raw: p.name.trim(), coded: codeDisplayName(p.id, p.name) }))
    .filter(
      (p) =>
        p.raw &&
        p.raw !== p.coded &&
        (DISPLAY_NAME_OVERRIDES[p.id] !== undefined ||
          EXPANDED_GLP_RE.test(p.raw) ||
          /^sema\b/i.test(p.raw))
    )
    .sort((a, b) => b.raw.length - a.raw.length)
    .map((p) => ({ ...p, re: new RegExp(escapeRegExp(p.raw), "gi") }));
  const tokenRe = new RegExp(EXPANDED_GLP_RE.source, "gi");

  return (text: string): string => {
    if (!text) return text;
    let out = text;
    for (const pair of pairs) out = out.replace(pair.re, pair.coded);
    return out.replace(tokenRe, (match) => {
      const owner = pairs.find((p) => p.raw.toLowerCase().includes(match.toLowerCase()));
      return owner ? owner.coded : "GLP compound";
    });
  };
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
  rarr: "→",
  larr: "←",
  times: "×",
  middot: "·",
  bull: "•",
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
 * Split one paragraph's HTML into text runs, keeping <strong>/<b> as bold.
 * Whitespace collapses inside runs but survives between them, so
 * "<strong>BPC-157</strong> is …" keeps its space.
 */
function inlineRuns(html: string): RichParagraph {
  const runs: TextRun[] = [];
  const push = (raw: string, strong: boolean) => {
    const text = decodeEntities(raw.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");
    if (text) runs.push({ text, strong });
  };
  const re = /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    push(html.slice(last, m.index), false);
    push(m[2] ?? "", true);
    last = m.index + m[0].length;
  }
  push(html.slice(last), false);

  if (runs.length > 0) {
    runs[0] = { ...runs[0], text: runs[0].text.trimStart() };
    const end = runs.length - 1;
    runs[end] = { ...runs[end], text: runs[end].text.trimEnd() };
  }
  return runs.filter((r) => r.text !== "");
}

/**
 * Parse short_description into paragraphs of runs — the product page's
 * "Description" block. Same paragraph rules as parseBullets.
 */
export function parseSummary(shortDescription: string): RichParagraph[] {
  if (!shortDescription) return [];
  let blocks = paragraphInners(shortDescription);
  if (blocks.length === 0) blocks = listItemInners(shortDescription);
  if (blocks.length === 0) blocks = [shortDescription];
  return blocks.map(inlineRuns).filter((runs) => runs.length > 0);
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
  const image: ProductImage = { src: img.src, alt: alt || displayName };
  if (img.thumbnail) image.thumbnail = img.thumbnail;
  return image;
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
  /** variationId -> live prices, from the single getVariations() list call. */
  variationPrices?: Record<number, VariationPrice>;
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
  // Never let a missing/zero regular price read as a 100% discount — fall back
  // to the live price so `onSale` stays false and no strike-through is drawn.
  const rawRegular = toMinor(raw.prices?.regular_price);
  const regularPriceMinor = rawRegular > priceMinor ? rawRegular : priceMinor;
  const currencyMinorUnit = raw.prices?.currency_minor_unit ?? 2;

  let variations: ProductVariation[] | undefined;
  if (kind === "variable" && Array.isArray(raw.variations) && raw.variations.length > 0) {
    variations = raw.variations.map((v) => {
      const size = v.attributes?.find((a) => /size/i.test(a.name))?.value ?? "";
      const vp = variationPrices?.[v.id];
      const vPrice = typeof vp?.priceMinor === "number" ? vp.priceMinor : priceMinor;
      const vRegular =
        typeof vp?.regularPriceMinor === "number" ? vp.regularPriceMinor : vPrice;
      return {
        variationId: v.id,
        size,
        priceMinor: vPrice,
        regularPriceMinor: vRegular > vPrice ? vRegular : vPrice,
      };
    });
  }

  const bullets = parseBullets(raw.short_description ?? "");
  const { usage, faq } = parseUsageAndFaq(raw.description ?? "");
  const images = (raw.images ?? [])
    .filter(
      (img) => !EXPANDED_GLP_RE.test(`${img.src} ${img.thumbnail ?? ""} ${img.alt ?? ""}`)
    )
    .map((img) => mapImage(img, displayName));
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
    regularPriceMinor,
    // Trust WooCommerce's own flag, but require a real price gap so a stale
    // `on_sale` can never render a strike-through against an equal price.
    onSale: Boolean(raw.on_sale) && regularPriceMinor > priceMinor,
    currencyMinorUnit,
    bullets,
    summary: parseSummary(raw.short_description ?? ""),
    usage,
    faq,
    images,
    isInStock: Boolean(raw.is_in_stock),
    isPurchasable: Boolean(raw.is_purchasable),
  };

  if (variations && variations.length > 0) product.variations = variations;
  // A simple product's single "Size" term, e.g. "70mg".
  const sizeTerms = raw.attributes?.find((a) => /size/i.test(a.name))?.terms ?? [];
  if (kind === "simple" && sizeTerms.length === 1) {
    product.size = decodeEntities(sizeTerms[0].name).trim();
  }
  if (coa.purity) product.purity = coa.purity;
  if (coa.coaUrl) product.coaUrl = coa.coaUrl;

  return product;
}
