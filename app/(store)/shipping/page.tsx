import type { Metadata } from "next";
import Link from "next/link";
import { faqPage, footerCopy, termsPage } from "@/content/site-copy";
import { brandConfig } from "@/content/brand-config";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";

// The live site has no shipping page. Everything here is live copy: the
// /faq/ "Shipping & Storage" group, Terms §7, the /faq/ return-policy answer,
// and the homepage shipping strip.
const shippingGroup = faqPage.groups.find((g) => g.label === "Shipping & Storage");
const returnPolicy = faqPage.groups
  .flatMap((g) => g.items)
  .find((item) => item.q === "What is your return policy?");
const processingSection = termsPage.sections.find((s) =>
  s.heading.includes("Order Processing & Shipping")
);

const { shippingSpeed, freeShipping } = brandConfig.promos;

export const metadata: Metadata = pageMetadata({
  title: shippingGroup?.label ?? "Shipping",
  description: `${shippingSpeed.label} | ${freeShipping.label}. ${
    shippingGroup?.items.find((i) => i.q === "How long does shipping take?")?.a ?? ""
  }`.trim(),
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        title={shippingGroup?.label ?? "Shipping"}
        sub={`${shippingSpeed.label} | ${freeShipping.label}`}
      />

      <div className="mt-16 grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
        {/* Left: the live Q&As and terms */}
        <div className="flex flex-col gap-14">
          {shippingGroup ? (
            <FadeIn>
              <dl className="border-t border-hairline">
                {shippingGroup.items.map((item) => (
                  <div
                    key={item.q}
                    className="flex flex-col gap-2 border-b border-hairline py-5"
                  >
                    <dt className="font-display text-[1.1rem] font-semibold tracking-[-0.01em] text-ink">
                      {item.q}
                    </dt>
                    <dd className="text-[15px] leading-relaxed text-ink-muted">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeIn>
          ) : null}

          {processingSection ? (
            <FadeIn>
              <section>
                <h2 className="font-display text-[1.5rem] tracking-[-0.025em] text-ink">
                  {processingSection.heading.replace(/^\d+\.\s*/, "")}
                </h2>
                <ul className="mt-4 flex max-w-2xl flex-col gap-2">
                  {processingSection.blocks.map((block) => (
                    <li
                      key={block.text}
                      className="flex gap-3 text-[15px] leading-relaxed text-ink-muted"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-3 h-px w-3 shrink-0 bg-green/40"
                      />
                      <span>{block.text}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          ) : null}

          {returnPolicy ? (
            <FadeIn>
              <section>
                <h2 className="font-display text-[1.5rem] tracking-[-0.025em] text-ink">
                  {returnPolicy.q}
                </h2>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                  {returnPolicy.a}
                </p>
                <Link
                  href="/terms"
                  className="mt-4 inline-flex items-center text-sm font-medium text-green underline decoration-hairline underline-offset-4 transition-colors hover:text-green-deep hover:decoration-green"
                >
                  {footerCopy.links.terms}
                </Link>
              </section>
            </FadeIn>
          ) : null}
        </div>

        {/* Right: the homepage shipping strip as a record card */}
        <FadeIn>
          <div className="plate lg:sticky lg:top-24">
            <aside className="plate-field flex flex-col gap-3 p-6 md:p-8">
              <p className="font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-ink">
                {shippingSpeed.label}
              </p>
              <p className="font-display text-[1.6rem] leading-tight font-bold tracking-[-0.02em] text-green">
                {freeShipping.label}
              </p>
            </aside>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
