import type { Metadata } from "next";
import Link from "next/link";
import { shippingPolicy, faqItems } from "@/content/site-copy";
import { brandConfig } from "@/content/brand-config";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = pageMetadata({
  title: "Shipping",
  description:
    "Primetime Research ships within the U.S. with cold-chain packaging for temperature-sensitive peptides. Standard delivery is 2-4 business days; free shipping over $200.",
  path: "/shipping",
});

export default function ShippingPage() {
  const returnPolicy = faqItems.find((f) => f.q === "What is your return policy?");

  // Conservative delivery estimate (FAQ) is primary; the "2-Day Shipping"
  // promo is surfaced only as a promotional footnote, not a guaranteed SLA.
  const rows: { label: string; value: string }[] = [
    { label: "Delivery estimate", value: shippingPolicy.faqClaim },
    { label: "Processing time", value: shippingPolicy.processingTime },
    { label: "Coverage", value: shippingPolicy.domesticOnly },
    { label: "Free shipping", value: brandConfig.promos.freeShipping.label },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Support"
        title="Shipping"
        sub="How orders are processed, packaged, and delivered."
      />

      <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
        {/* Left: the shipping record */}
        <div className="flex flex-col gap-14">
          <FadeIn>
            <dl className="border-t border-hairline">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col gap-1.5 border-b border-hairline py-4.5 sm:flex-row sm:items-baseline sm:gap-8"
                >
                  <dt className="micro-label sm:w-44 sm:shrink-0">
                    {row.label}
                  </dt>
                  <dd className="text-[15px] leading-relaxed text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
              The store also advertises a{" "}
              <span className="data-num">
                {brandConfig.promos.shippingSpeed.label}
              </span>{" "}
              promotion. Delivery estimates are not guaranteed and may vary by
              carrier and destination.
            </p>
          </FadeIn>

          {/* Cold chain */}
          <FadeIn>
            <section>
              <p className="micro-label">Handling</p>
              <h2 className="mt-3 font-display text-[1.5rem] tracking-[-0.025em] text-ink">
                Cold-chain handling
              </h2>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                {shippingPolicy.coldChain}
              </p>
            </section>
          </FadeIn>

          {/* Returns / damaged */}
          {returnPolicy ? (
            <FadeIn>
              <section>
                <p className="micro-label">Returns</p>
                <h2 className="mt-3 font-display text-[1.5rem] tracking-[-0.025em] text-ink">
                  Damaged or incorrect items
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                  {returnPolicy.a}
                </p>
                <Link
                  href="/terms"
                  className="mt-4 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
                >
                  Read the full terms
                </Link>
              </section>
            </FadeIn>
          ) : null}
        </div>

        {/* Right: the at-a-glance record card */}
        <FadeIn>
          <div className="plate lg:sticky lg:top-24">
            <aside className="plate-field p-6 md:p-8">
              <p className="micro-label">At a glance</p>
              <ul className="mt-4 flex flex-col">
                <li className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
                  <span className="text-sm text-ink-muted">Ships from</span>
                  <span className="data-num text-sm text-ink">USA</span>
                </li>
                <li className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
                  <span className="text-sm text-ink-muted">Delivery</span>
                  <span className="data-num text-sm text-ink">2–4 days</span>
                </li>
                <li className="flex items-baseline justify-between gap-4 border-b border-hairline py-3">
                  <span className="text-sm text-ink-muted">Processing</span>
                  <span className="data-num text-sm text-ink">1 day</span>
                </li>
                <li className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-sm text-ink-muted">Free over</span>
                  <span className="data-num text-sm text-green">$200</span>
                </li>
              </ul>
              <p className="micro-label mt-6 leading-relaxed">
                Temperature-sensitive compounds ship with cold packs and
                insulated packaging.
              </p>
            </aside>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
