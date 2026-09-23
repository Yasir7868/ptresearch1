"use client";

/**
 * HomeFaq (#faq) — the live homepage FAQ (homepageFaq: "FAQ's" / "here's
 * what you should know" + its five questions) as bordered rows. One answer
 * open at a time, the first open on load, +/− marker (the design's
 * accordion). Client component for the open state.
 */

import { useId, useState } from "react";
import { homepageFaq } from "@/content/site-copy";
import { Kicker, SERIF } from "./parts";
import { cn } from "@/lib/utils";

export function HomeFaq() {
  const [open, setOpen] = useState(0);
  const baseId = useId();

  return (
    <section id="faq" className="scroll-mt-[69px] border-t border-rule bg-white">
      <div className="mx-auto max-w-[860px] px-6 py-16">
        <Kicker>{homepageFaq.eyebrow}</Kicker>
        <h2
          className={cn(
            SERIF,
            "my-2 text-[clamp(28px,3.8vw,40px)] tracking-[-0.015em] text-navy-ink first-letter:uppercase"
          )}
        >
          {homepageFaq.heading}
        </h2>
        <p className="mb-6 text-[16px] text-steel-ink">{homepageFaq.body}</p>

        <ul className="flex flex-col gap-2">
          {homepageFaq.items.map((item, i) => {
            const isOpen = open === i;
            const panelId = `${baseId}-panel-${i}`;
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-[12px] border border-rule"
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="flex min-h-[52px] w-full cursor-pointer items-center justify-between gap-3 bg-white px-[18px] py-4 text-left text-[16px] font-bold text-navy-ink"
                  >
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-[20px] leading-none text-cobalt"
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  hidden={!isOpen}
                  className="px-[18px] pb-[18px] text-[15px] leading-[1.6] whitespace-pre-line text-steel-ink"
                >
                  {item.a}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
