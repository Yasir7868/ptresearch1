/**
 * FeaturedCompounds — the live homepage's product carousel (no heading on the
 * live site) rendered as a SPECIMEN PLATE grid (3-up desktop / 2-up tablet /
 * 1-up mobile, DESIGN §4): duotoned vial on surface, typeset record (Satoshi
 * name + Satoshi tabular data line). The earned VerifiedMark renders ONLY
 * where a real COA exists (judge graft #2) — its absence carries meaning.
 *
 * Server component (SpecimenPlate hover is pure CSS); selection happens
 * server-side in app/page.tsx.
 */

import type { Product } from "@/lib/woo/types";
import { formatPriceRange } from "@/lib/format";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import {
  VIAL_FIELD_RATIO,
  VIAL_GRID_SIZES,
  VIAL_ZOOM,
} from "@/components/plate/vial-crop";
import { FadeInStagger, FadeIn } from "@/components/motion/FadeIn";

export function FeaturedCompounds({ products }: { products: Product[] }) {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <FadeInStagger
          className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          staggerMs={70}
        >
          {products.map((product) => {
            const image = product.images[0];

            return (
              <FadeIn key={product.productId}>
                <SpecimenPlate
                  image={
                    image
                      ? {
                          src: image.src,
                          alt: image.alt || product.displayName,
                        }
                      : undefined
                  }
                  field={
                    image ? undefined : (
                      <span className="font-display text-[1.2rem] font-semibold tracking-[-0.01em] text-ink-muted">
                        {product.displayName}
                      </span>
                    )
                  }
                  fieldRatio={VIAL_FIELD_RATIO}
                  imageZoom={image ? VIAL_ZOOM : undefined}
                  imageSizes={VIAL_GRID_SIZES}
                  eyebrow={product.categoryName}
                  title={product.displayName}
                  record={
                    <>
                      {product.purity && (
                        <>
                          <span className="text-green">{product.purity}</span>
                          <span className="batch-tick">·</span>
                        </>
                      )}
                      {formatPriceRange(product)}
                    </>
                  }
                  verified={Boolean(product.coaUrl)}
                  href={`/product/${product.slug}`}
                  ariaLabel={product.displayName}
                />
              </FadeIn>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
