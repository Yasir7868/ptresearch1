import type { Metadata } from "next";
import { trackOrderPage } from "@/content/site-copy";
import { pageMetadata } from "@/components/static/page-meta";
import { PageHeader } from "@/components/static/PageHeader";
import { TrackOrderForm } from "@/components/static/TrackOrderForm";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = pageMetadata({
  title: trackOrderPage.title,
  description: trackOrderPage.intro,
  path: "/track-order",
});

export default function TrackOrderPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <PageHeader title={trackOrderPage.title} sub={trackOrderPage.intro} />

      <div className="mt-16 max-w-xl">
        <FadeIn>
          <TrackOrderForm />
        </FadeIn>
      </div>
    </main>
  );
}
