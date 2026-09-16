/**
 * FaqTeaser — record-card accordion drawn from the CANONICAL 9-item /faq set
 * (DESIGN §7.11 — the detailed, method-specific set; the redundant 5-item
 * homepage set is dropped). Four essentials teased here — purity, storage,
 * shipping, returns — with a link to the full page. The third-party-testing
 * item lives in TestingStory, so it is not repeated.
 *
 * Server component mounting the shadcn Accordion (client leaf). Copy verbatim
 * from content/site-copy.ts.
 */

import Link from "next/link";
import { faqItems } from "@/content/site-copy";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/FadeIn";

const PICKS = [
  "What purity levels do you guarantee?",
  "How should I store my peptides?",
  "How long does shipping take?",
  "What is your return policy?",
] as const;

const items = PICKS.flatMap((q) => {
  const item = faqItems.find((f) => f.q === q);
  return item ? [item] : [];
});

export function FaqTeaser() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <FadeIn>
            <p className="micro-label">Questions</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
              Frequently asked
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
              Purity, storage, shipping, and returns — the essentials for
              research buyers.
            </p>
            <Link
              href="/faq"
              className="mt-7 inline-block text-sm font-[540] text-green underline-offset-4 transition-colors hover:text-green-deep hover:underline"
            >
              Read all FAQs →
            </Link>
          </FadeIn>

          <FadeIn>
            <Accordion
              type="single"
              collapsible
              className="soft-card overflow-hidden px-5 md:px-6"
            >
              {items.map((item) => (
                <AccordionItem
                  key={item.q}
                  value={item.q}
                  className="border-hairline/60"
                >
                  <AccordionTrigger className="py-5 font-display text-[17px] leading-snug font-semibold tracking-[-0.01em] text-ink hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-[15px] leading-relaxed whitespace-pre-line text-ink-muted">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
