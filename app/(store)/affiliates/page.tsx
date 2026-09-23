import type { Metadata } from "next";
import Link from "next/link";
import { affiliatePages } from "@/content/site-copy";
import { brandConfig } from "@/content/brand-config";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { FadeIn } from "@/components/motion/FadeIn";

const { coupon } = brandConfig.promos;

export const metadata: Metadata = pageMetadata({
  title: affiliatePages.dashboardTitle,
  description: `${coupon.codeLabel} ${coupon.code} — ${coupon.detail}`,
  path: "/affiliates",
});

// The live /affiliates/ page is a Coupon Affiliates plugin dashboard with no
// prose: its only copy is the page title and the site-wide PT25 promo banner.
export default function AffiliatesPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader title={affiliatePages.dashboardTitle} />

      {/* The live promo banner, framed as a soft plate */}
      <FadeIn className="mt-14">
        <div className="plate">
          <div className="plate-field flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <div>
              <p className="micro-label">{coupon.badge}</p>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink">
                {coupon.codeLabel}{" "}
                <span className="data-num text-green">{coupon.code}</span>
              </p>
              <p className="mt-1 text-[15px] font-medium text-ink">
                {coupon.detail}
              </p>
            </div>
            <Link
              href="/catalog"
              className="inline-flex h-10 shrink-0 items-center justify-center self-start rounded-lg bg-green px-6 text-sm font-medium text-surface transition-colors hover:bg-green-deep sm:self-center"
            >
              {coupon.cta}
            </Link>
          </div>
        </div>
      </FadeIn>

      <FadeIn className="mt-12">
        <p className="micro-label border-t border-hairline pt-6 leading-relaxed">
          Demo — the affiliate dashboard connects to the store backend at
          launch.
        </p>
      </FadeIn>
    </main>
  );
}
