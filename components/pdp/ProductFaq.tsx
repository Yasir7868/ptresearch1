/**
 * ProductFaq — per-product FAQ as a warm RECORD CARD: one soft rounded
 * surface panel, questions as gently-ruled rows (accordion). Server Component
 * file: the shadcn Accordion primitives are the client leaf; questions/answers
 * are plain strings parsed VERBATIM from the live store description.
 *
 * Returns null when the product has no renderable Q&A pairs, so the page can
 * mount it unconditionally.
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/woo/types";

export function ProductFaq({ faq }: { faq: FaqItem[] }) {
  const items = faq.filter((item) => item.q && item.a);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="pdp-faq" className="hairline-t py-12 md:py-16">
      <p className="micro-label mb-3">Product FAQ</p>
      <h2 id="pdp-faq" className="text-[clamp(1.9rem,3.4vw,3rem)] text-ink">
        Frequently asked questions
      </h2>
      <Accordion
        type="single"
        collapsible
        className="soft-card mt-8 max-w-3xl overflow-hidden"
      >
        {items.map((item, i) => (
          <AccordionItem
            key={item.q}
            value={`faq-${i}`}
            className="border-hairline/60 px-5"
          >
            <AccordionTrigger className="py-4 text-[15px] font-medium text-ink hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-[15px] leading-relaxed text-ink-muted">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
