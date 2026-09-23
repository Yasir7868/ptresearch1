/**
 * FaqTeaser — the live homepage FAQ block ("FAQ's" / "here’s what you should
 * know" + its five questions) as a record-card accordion. The live homepage
 * set is shorter and worded differently from the /faq page set.
 *
 * Server component mounting the shadcn Accordion (client leaf). Copy verbatim
 * from content/site-copy.ts.
 */

import { homepageFaq } from "@/content/site-copy";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/FadeIn";

export function FaqTeaser() {
  return (
    <section className="bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-6 md:py-32">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <FadeIn>
            <p className="micro-label">{homepageFaq.eyebrow}</p>
            <h2 className="mt-4 text-[clamp(1.9rem,3.4vw,3rem)]">
              {homepageFaq.heading}
            </h2>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-muted">
              {homepageFaq.body}
            </p>
          </FadeIn>

          <FadeIn>
            <Accordion
              type="single"
              collapsible
              className="soft-card overflow-hidden px-5 md:px-6"
            >
              {homepageFaq.items.map((item) => (
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
