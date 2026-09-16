/**
 * FeaturedCompounds — curated real products rendered as a SPECIMEN PLATE grid
 * (3-up desktop / 2-up tablet / 1-up mobile, DESIGN §4): duotoned vial on
 * surface, crop-mark ticks, typeset record (Satoshi name + Satoshi
 * tabular data line). The earned VerifiedMark renders ONLY where a real COA
 * exists (judge graft #2) — its absence carries meaning.
 *
 * Server component (SpecimenPlate hover is pure CSS); selection happens
 * server-side in app/page.tsx.
 */

import Link from "next/link";
import type { Product } from "@/lib/woo/types";
import { formatMinor } from "@/components/home/format";
import { SpecimenPlate } from "@/components/plate/SpecimenPlate";
import { FadeIn, FadeInStagger } from "@/components/motion/FadeIn";

export function FeaturedCompounds({ products }: { products: Product[] }) {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <FadeIn className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="micro-label">Selected compounds</p>
            <h2 className="mt-4 max-w-xl text-[clamp(1.9rem,3.4vw,3rem)]">
              Featured research peptides
            </h2>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-[540] text-green underline-offset-4 transition-colors hover:text-green-deep hover:underline"
          >
            View full catalog →
          </Link>
        </FadeIn>

        <FadeInStagger
          className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          staggerMs={70}
        >
          {products.map((product) => {
            const image = product.images[0];
            const price = formatMinor(
              product.priceMinor,
              product.currencyMinorUnit
            );

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
                  imageSizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
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
                      {product.kind === "variable" ? `from ${price}` : price}
                    </>
                  }
                  verified={Boolean(product.coaUrl)}
                  href={`/product/${product.slug}`}
                  ariaLabel={`${product.displayName} — view product`}
                />
              </FadeIn>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
