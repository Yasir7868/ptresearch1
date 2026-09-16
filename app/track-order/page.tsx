import type { Metadata } from "next";
import { faqItems } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { TrackOrderForm } from "@/components/static/TrackOrderForm";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = pageMetadata({
  title: "Track Order",
  description:
    "Look up the status of a Primetime Research order. Tracking details are also emailed once your order ships.",
  path: "/track-order",
});

export default function TrackOrderPage() {
  const trackingFaq = faqItems.find((f) => f.q === "How can I track my order?");

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader
        label="Support"
        title="Track Your Order"
        sub="Enter your order number and email to check status."
      />

      <div className="mt-16 max-w-xl">
        <FadeIn>
          <TrackOrderForm />
        </FadeIn>

        {trackingFaq ? (
          <FadeIn className="mt-10">
            <div className="border-t border-hairline pt-5">
              <p className="micro-label mb-2.5">Good to know</p>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                {trackingFaq.a}
              </p>
            </div>
          </FadeIn>
        ) : null}
      </div>
    </main>
  );
}
