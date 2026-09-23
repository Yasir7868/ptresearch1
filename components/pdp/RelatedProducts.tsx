/**
 * RelatedProducts — the live template's "Related Products" section: a Poppins
 * heading over the loop carousel (RelatedCarousel). Server Component;
 * selection happens here from the already-cached catalog.
 *
 * The live carousel holds six products. Selection order: same primary
 * category first, then products sharing any of the current product's
 * secondary categories, then catalog order — always excluding the product
 * itself. Returns null when nothing qualifies.
 *
 * `current` is omitted on /gift-card: the gift card is not a catalog product
 * and has no category, so its carousel is simply the first six in catalog
 * order (the live page's own related row is likewise category-less — the
 * store leaves the gift card "Uncategorized").
 */

import type { Product } from "@/lib/woo/types";
import { productPage } from "@/content/site-copy";
import { RelatedCarousel, type RelatedItem } from "./RelatedCarousel";

const RELATED_COUNT = 6;

/** Pick up to six related products for the given product, or the first six. */
function pickRelated(catalog: Product[], current?: Product): Product[] {
  if (!current) return catalog.slice(0, RELATED_COUNT);

  const rest = catalog.filter((p) => p.slug !== current.slug);
  const wanted = new Set([current.categorySlug, ...current.secondaryCategories]);

  const ranked = [
    ...rest.filter((p) => p.categorySlug === current.categorySlug),
    ...rest.filter(
      (p) => wanted.has(p.categorySlug) || p.secondaryCategories.some((s) => wanted.has(s))
    ),
    ...rest,
  ];
  return [...new Set(ranked)].slice(0, RELATED_COUNT);
}

function toItem(p: Product): RelatedItem {
  const img = p.images[0];
  return {
    productId: p.productId,
    sku: p.sku,
    slug: p.slug,
    name: p.displayName,
    image: img ? { src: img.src, alt: img.alt } : undefined,
    kind: p.kind,
    available: p.isPurchasable && p.isInStock,
    onSale: p.onSale,
    priceMinor: p.priceMinor,
    regularPriceMinor: p.regularPriceMinor,
    currencyMinorUnit: p.currencyMinorUnit,
    variations: p.variations?.map((v) => ({
      priceMinor: v.priceMinor,
      regularPriceMinor: v.regularPriceMinor,
    })),
  };
}

export function RelatedProducts({
  catalog,
  current,
}: {
  catalog: Product[];
  current?: Product;
}) {
  const related = pickRelated(catalog, current);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="pdp-related"
      className="bg-white px-[6%] pt-[34px] pb-12 md:px-[4%] md:pt-[67px]"
    >
      <h2
        id="pdp-related"
        className="mb-[50px] font-poppins text-[28px] leading-[1.1] font-semibold text-[#1c244b] md:mb-[19px] md:text-[45px] md:leading-[1.2] lg:text-[49px]"
      >
        {productPage.relatedHeading}
      </h2>
      <RelatedCarousel items={related.map(toItem)} label={productPage.relatedHeading} />
    </section>
  );
}
