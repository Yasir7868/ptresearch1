import type { Metadata } from "next";
import { affiliateProgram } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = pageMetadata({
  title: "Affiliates",
  description:
    "Join the Primetime Research affiliate program — share code PT25 for 25% off all research compounds and earn on qualifying referred orders.",
  path: "/affiliates",
});

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Join",
    body: "Apply for an affiliate account. Once approved, you receive a unique code and referral links.",
  },
  {
    n: "02",
    title: "Share",
    body: "Share your code and links with your audience — researchers, laboratories, and communities.",
  },
  {
    n: "03",
    title: "Earn",
    body: "Earn on qualifying orders placed with your code. Commission details are shown in your affiliate dashboard.",
  },
];

export default function AffiliatesPage() {
  const { promo } = affiliateProgram;

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Program"
        title="Affiliates"
        sub="Partner with Primetime Research and share research-grade peptides with your audience."
      />

      {/* Promo record — verbatim code + headline, framed as a soft plate */}
      <FadeIn className="mt-14">
        <div className="plate">
          <div className="plate-field flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <p className="micro-label">Audience discount</p>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink">
                Your audience saves with code{" "}
                <span className="data-num text-green">{promo.code}</span> —{" "}
                {promo.headline}.
              </p>
            </div>
            <span className="data-num shrink-0 self-start rounded-lg border border-green px-5 py-2.5 text-lg tracking-[0.08em] text-green sm:self-center">
              {promo.code}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* How it works */}
      <section className="mt-24">
        <FadeIn>
          <p className="micro-label">How it works</p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
            Join, share, earn.
          </h2>
        </FadeIn>

        <FadeIn className="mt-12">
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="flex h-full flex-col border-t border-hairline pt-6"
              >
                <span className="font-display text-[2.2rem] leading-none font-bold tracking-[-0.02em] [font-variant-numeric:tabular-nums_lining-nums] text-green">
                  {step.n}
                </span>
                <h3 className="mt-4 text-[1.25rem]">{step.title}</h3>
                <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* CTA — honestly disabled for the demo */}
      <FadeIn className="mt-20">
        <div className="flex flex-col items-start gap-3 border-t border-hairline pt-6">
          <button
            type="button"
            disabled
            className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-lg border border-hairline bg-surface px-5 text-sm font-medium text-ink-muted"
          >
            Affiliate dashboard opens at launch
          </button>
          <p className="micro-label leading-relaxed">
            Applications and commission details go live with the store.
            Commission rates are set in the affiliate dashboard.
          </p>
        </div>
      </FadeIn>
    </main>
  );
}
