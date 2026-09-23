import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StoreShell } from "@/components/chrome/StoreShell";
import { catalogPage, footerCopy, notFoundPage } from "@/content/site-copy";

/** 404 — styled per D3 "Reference Grade": the error number set as a Satoshi
    trophy numeral on paper, with the live site's 404 copy below. Rendered
    outside app/(store), so it brings the shop chrome with it. */
export default function NotFound() {
  return (
    <StoreShell>
      <main className="mx-auto flex min-h-[60dvh] max-w-3xl flex-col items-start justify-center gap-6 px-6 py-20 md:py-28">
        <p className="trophy-num text-[clamp(4rem,16vw,9rem)]">404</p>

        <div>
          <h1 className="font-display text-[clamp(1.9rem,3.4vw,3rem)] tracking-[-0.025em] text-ink">
            {notFoundPage.heading}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
            {notFoundPage.body}
          </p>
        </div>

        <div className="mt-1 flex gap-2.5">
          <Button asChild>
            <Link href="/catalog">{catalogPage.title}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">{footerCopy.links.home}</Link>
          </Button>
        </div>
      </main>
    </StoreShell>
  );
}
