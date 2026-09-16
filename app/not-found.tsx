import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 404 — styled per D3 "Reference Grade": the error number set as a Satoshi
    trophy numeral on paper, restrained record-tone copy below. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] max-w-3xl flex-col items-start justify-center gap-6 px-6 py-20 md:py-28">
      <p className="micro-label">Error 404</p>

      <p className="trophy-num text-[clamp(4rem,16vw,9rem)]">404</p>

      <div>
        <h1 className="font-display text-[clamp(1.9rem,3.4vw,3rem)] tracking-[-0.025em] text-ink">
          Page not found
        </h1>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted">
          The page you requested does not exist or has moved. The full reference
          catalog is one step away.
        </p>
      </div>

      <div className="mt-1 flex gap-2.5">
        <Button asChild>
          <Link href="/catalog">Browse the catalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>

      <hr className="mt-6 w-full" />
      <p className="data-num text-[11px] tracking-[0.06em] text-ink-muted uppercase">
        HTTP 404 — resource not located
      </p>
    </main>
  );
}
