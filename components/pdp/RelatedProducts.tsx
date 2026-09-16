/**
 * RelatedProducts — 3–4 same-category compounds as MINI SPECIMEN PLATES
 * (DESIGN §4: the plate is the product card everywhere). Server Component;
 * selection happens here from the already-cached catalog.
 *
 * DUOTONE DECISION: these plates are a DECORATIVE catalog context — the buyer
 * inspects true color on the main gallery plate above, so the related vials
 * take the full duotone treatment (SpecimenPlate default) and read as one
 * collection. Crop ticks stay ink (chromatic-restraint rule — a 4-up grid of
 * amber ticks would blow the three-chromatic-elements budget).
 *
 * The VerifiedMark is EARNED: it renders only where a real coaUrl exists.
 *
 * Selection order: same primary category first, then products sharing any of
 * the current product's secondary categories, then catalog order — always
 * excluding the product itself. Returns null when nothing qualifies.
 */

import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import type { Product } from "@/lib/woo/types";
import { formatMinor } from "./money";

const MAX_RELATED = 4;
const MIN_RELATED = 3;

/** Pick up to 4 related products for the given product. */
function pickRelated(catalog: Product[], current: Product): Product[] {
  const rest = catalog.filter((p) => p.slug !== current.slug);

  const sameCategory = rest.filter(
    (p) => p.categorySlug === current.categorySlug
  );

  const related = [...sameCategory];

  if (related.length < MIN_RELATED) {
    const wanted = new Set([
      current.categorySlug,
      ...current.secondaryCategories,
    ]);
    for (const p of rest) {
      if (related.length >= MIN_RELATED) break;
      if (related.includes(p)) continue;
      if (
        wanted.has(p.categorySlug) ||
        p.secondaryCategories.some((s) => wanted.has(s))
      ) {
        related.push(p);
      }
    }
  }

  if (related.length < MIN_RELATED) {
    for (const p of rest) {
      if (related.length >= MIN_RELATED) break;
      if (!related.includes(p)) related.push(p);
    }
  }

  return related.slice(0, MAX_RELATED);
}

export function RelatedProducts({
  catalog,
  current,
}: {
  catalog: Product[];
  current: Product;
}) {
  const related = pickRelated(catalog, current);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="pdp-related"
      className="hairline-t py-12 md:py-16"
    >
      <p className="micro-label mb-3">{current.categoryName}</p>
      <h2 id="pdp-related" className="text-[clamp(1.9rem,3.4vw,3rem)] text-ink">
        Related compounds
      </h2>

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((p) => {
          const img = p.images[0];
          return (
            <SpecimenPlate
              key={p.slug}
              href={`/product/${p.slug}`}
              ariaLabel={`${p.displayName} — view product`}
              // Duotone stays ON (default) — decorative context, see header.
              {...(img
                ? { image: { src: img.src, alt: img.alt } }
                : {
                    field: (
                      <span className="micro-label">{p.displayName}</span>
                    ),
                  })}
              imageSizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
              eyebrow={p.categoryName}
              title={p.displayName}
              record={
                <>
                  {p.purity && (
                    <>
                      <span className="text-green">{p.purity}</span>
                      <span aria-hidden="true"> · </span>
                    </>
                  )}
                  {p.kind === "variable" && (
                    <span className="font-normal">From </span>
                  )}
                  {formatMinor(p.priceMinor, p.currencyMinorUnit)}
                </>
              }
              verified={Boolean(p.coaUrl)}
            />
          );
        })}
      </div>
    </section>
  );
}
