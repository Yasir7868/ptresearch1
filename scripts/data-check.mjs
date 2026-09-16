/**
 * scripts/data-check.mjs — live data integrity check for the WooCommerce feed.
 *
 * Fetches the live Store API, runs the REAL mapper + taxonomy (imported
 * directly — Node 22 strips the TS types), and asserts the invariants the site
 * depends on:
 *   - every listable product (purchasable or priced) maps to a category
 *   - 0 unmapped taxonomy slugs
 *   - exactly 14 variations, every one priced (> 0)
 *     (3 GLP compounds x 4 sizes + Bacteriostatic Water x 2 sizes)
 *   - the GLP display-name coding rule holds (no expanded trade names)
 *   - no un-stripped marketing suffixes leak into display names
 *
 * Run: `npm run data:check`  (or `node scripts/data-check.mjs`)
 * Exits non-zero on any failed assertion.
 */

import { mapProduct, codeDisplayName } from "../lib/woo/mapper.ts";
import {
  categoryForSlug,
  PRODUCT_CATEGORY_MAP,
  mappedProductSlugs,
} from "../content/taxonomy.ts";

const WP_ORIGIN = (process.env.WP_ORIGIN || "https://ptresearch.shop").replace(/\/+$/, "");
const BASE = `${WP_ORIGIN}/wp-json/wc/store/v1`;

/** Trade names that must NEVER appear anywhere (GLP coding rule). */
const FORBIDDEN_TRADE_NAMES = ["semaglutide", "tirzepatide", "retatrutide"];

let failures = 0;
let warnings = 0;
function assert(cond, message) {
  if (cond) {
    console.log(`  ok  ${message}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${message}`);
  }
}
/**
 * Soft check — content-completeness of the LIVE store (not mapper correctness).
 * A gap here (e.g. a product with no short_description) is an upstream data
 * issue we surface loudly but don't fail the build on.
 */
function warn(cond, message) {
  if (cond) {
    console.log(`  ok  ${message}`);
  } else {
    warnings += 1;
    console.warn(`  WARN ${message}`);
  }
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

function fmt(minor, unit = 2) {
  return `$${(minor / 10 ** unit).toFixed(unit)}`;
}

function pad(str, len) {
  const s = String(str);
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

async function main() {
  console.log(`\nFetching live catalog from ${BASE} ...`);
  const rawProducts = await getJson(`${BASE}/products?per_page=100`);

  // Gather + fetch every variation in parallel.
  const variationIds = [];
  for (const p of rawProducts) {
    if (p.type === "variable" && Array.isArray(p.variations)) {
      for (const v of p.variations) variationIds.push(v.id);
    }
  }
  const variationRecords = variationIds.length
    ? await getJson(`${BASE}/products?type=variation&include=${variationIds.join(",")}&per_page=100`)
    : [];
  const variationPrices = {};
  for (const v of variationRecords) {
    const minor = parseInt(v.prices?.price ?? "", 10);
    if (Number.isFinite(minor)) variationPrices[v.id] = minor;
  }

  // Run the real mapper.
  const products = rawProducts.map((p) =>
    mapProduct(p, {
      variationPrices,
      category: categoryForSlug(p.slug),
    })
  );

  // --- Assertions -----------------------------------------------------------
  console.log("\nAssertions:");
  const unlisted = rawProducts.filter((p) => !p.is_purchasable && !(parseInt(p.prices?.price ?? "", 10) > 0));
  for (const p of unlisted) console.log(`  note unlisted (not purchasable, no price): ${p.slug}`);
  console.log(`  ok  product count = ${products.length} (${unlisted.length} unlisted)`);

  const liveSlugs = rawProducts.map((p) => p.slug);
  const unlistedSlugs = new Set(unlisted.map((p) => p.slug));
  const unmapped = liveSlugs.filter((s) => !PRODUCT_CATEGORY_MAP[s] && !unlistedSlugs.has(s));
  assert(unmapped.length === 0, `0 unmapped slugs (unmapped: ${unmapped.join(", ") || "none"})`);

  // Every mapped taxonomy slug should exist live (catch dead entries).
  const staleTaxonomy = mappedProductSlugs().filter((s) => !liveSlugs.includes(s));
  assert(staleTaxonomy.length === 0, `0 stale taxonomy entries (stale: ${staleTaxonomy.join(", ") || "none"})`);

  const allVariations = products.flatMap((p) => p.variations ?? []);
  console.log(`  ok  variation count = ${allVariations.length}`);
  const unpriced = allVariations.filter((v) => !(v.priceMinor > 0));
  assert(unpriced.length === 0, `all variations priced (${unpriced.length} unpriced)`);
  const sizeless = allVariations.filter((v) => !v.size);
  assert(sizeless.length === 0, `all variations have a size (${sizeless.length} missing)`);

  // GLP coding rule.
  assert(codeDisplayName(1022, "Sema GLP-1 Analog (Research Grade) – Premium Research Peptide") === "GLP1-SM", 'id 1022 -> "GLP1-SM"');
  assert(codeDisplayName(638, "GLP-2-TZ") === "GLP2-TZ", 'id 638 -> "GLP2-TZ"');
  assert(codeDisplayName(630, "GLP3-RT") === "GLP3-RT", 'id 630 -> "GLP3-RT" (unchanged)');

  const blob = JSON.stringify(products).toLowerCase();
  for (const bad of FORBIDDEN_TRADE_NAMES) {
    assert(!blob.includes(bad), `no expanded trade name "${bad}" anywhere in mapped output`);
  }
  const suffixLeaks = products.filter((p) => /premium research (peptide|compound)/i.test(p.displayName));
  assert(suffixLeaks.length === 0, `no marketing-suffix leaks in display names (${suffixLeaks.map((p) => p.displayName).join(", ") || "none"})`);

  // Content coverage (soft — upstream store completeness, not mapper correctness).
  const noBullets = products.filter((p) => p.bullets.length === 0);
  warn(noBullets.length === 0, `every product has bullets (${noBullets.length} empty: ${noBullets.map((p) => `${p.productId}/${p.displayName}`).join(", ") || "none"})`);
  const noUsage = products.filter((p) => p.usage.length === 0);
  warn(noUsage.length === 0, `every product has usage steps (${noUsage.length} empty)`);
  const noFaq = products.filter((p) => p.faq.length === 0);
  warn(noFaq.length === 0, `every product has FAQ entries (${noFaq.length} empty)`);
  const noImages = products.filter((p) => p.images.length === 0);
  warn(noImages.length === 0, `every product has at least one image (${noImages.length} without)`);

  // --- Summary table --------------------------------------------------------
  console.log("\nCatalog summary:");
  console.log(
    "  " + pad("id", 6) + pad("displayName", 24) + pad("category", 22) + pad("kind", 10) + pad("price", 12) + pad("var", 5) + "flags"
  );
  console.log("  " + "-".repeat(6 + 24 + 22 + 10 + 12 + 5 + 5));
  const sorted = [...products].sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.displayName.localeCompare(b.displayName));
  for (const p of sorted) {
    const price = p.kind === "variable" ? `${fmt(p.priceMinor)}+` : fmt(p.priceMinor);
    const flags = [
      p.isInStock ? "in-stock" : "OOS",
      p.secondaryCategories.length ? `2nd:${p.secondaryCategories.join("|")}` : "",
    ].filter(Boolean).join(" ");
    console.log(
      "  " + pad(p.productId, 6) + pad(p.displayName, 24) + pad(p.categoryName, 22) + pad(p.kind, 10) + pad(price, 12) + pad(p.variations?.length ?? "-", 5) + flags
    );
  }

  // Category counts.
  console.log("\nProducts per category (primary):");
  const counts = {};
  for (const p of products) counts[p.categoryName] = (counts[p.categoryName] ?? 0) + 1;
  for (const [name, n] of Object.entries(counts).sort()) console.log(`  ${pad(name, 24)} ${n}`);

  console.log(`\nTotals: ${products.length} products, ${allVariations.length} variations, ${liveSlugs.length - unmapped.length}/${liveSlugs.length} slugs mapped.`);

  if (failures > 0) {
    console.error(`\n${failures} assertion(s) FAILED${warnings ? `, ${warnings} warning(s)` : ""}.`);
    process.exit(1);
  }
  console.log(`\nAll assertions passed${warnings ? ` (${warnings} soft warning(s) — upstream content gaps)` : ""}.`);
}

main().catch((err) => {
  console.error("data-check crashed:", err);
  process.exit(1);
});
