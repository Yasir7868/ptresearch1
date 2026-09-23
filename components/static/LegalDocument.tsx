/**
 * LegalDocument — warm editorial typography for verbatim Terms / Privacy
 * content (D3 "Reference Grade").
 *
 * Renders a LegalSection[] (content/site-copy.ts) at a readable ~70ch measure
 * with a dot-leader contents rail (sticky on desktop) — the printed-catalog
 * index treatment. Section headings are Satoshi 650; body stays Satoshi ~430.
 * Content passes through VERBATIM — this component only handles layout and
 * grouping (consecutive `li` blocks collapse into one list; `\n\n` inside a
 * paragraph becomes separate paragraphs).
 *
 * Server component.
 */
import type { LegalBlock, LegalSection } from "@/content/site-copy";
import { FadeIn } from "@/components/motion/FadeIn";

/** Split a verbatim block that may contain blank-line paragraph breaks. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Stable anchor id from a verbatim heading. */
function anchorId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Group a section's blocks so that consecutive `li` blocks share one <ul>. */
type Rendered =
  | { kind: "p"; text: string }
  | { kind: "subheading"; text: string }
  | { kind: "ul"; items: string[] };

function groupBlocks(blocks: LegalBlock[]): Rendered[] {
  const out: Rendered[] = [];
  for (const block of blocks) {
    if (block.type === "li") {
      const last = out[out.length - 1];
      if (last && last.kind === "ul") {
        last.items.push(block.text);
      } else {
        out.push({ kind: "ul", items: [block.text] });
      }
    } else if (block.type === "subheading") {
      out.push({ kind: "subheading", text: block.text });
    } else {
      out.push({ kind: "p", text: block.text });
    }
  }
  return out;
}

export function LegalDocument({
  sections,
  updated,
}: {
  sections: LegalSection[];
  /** Optional "Last Updated" line shown above the document. */
  updated?: string;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-20">
      {/* Section index — dot-leader, sticky on desktop */}
      <FadeIn>
        <nav aria-label="Sections" className="lg:sticky lg:top-24">
          <ol className="flex flex-col">
            {sections.map((section) => (
              <li key={section.heading} className="hairline-t">
                <a
                  href={`#${anchorId(section.heading)}`}
                  className="group flex items-baseline gap-2 py-2.5"
                >
                  <span className="text-[13px] leading-snug text-ink-muted transition-colors group-hover:text-ink">
                    {section.heading}
                  </span>
                  <span
                    aria-hidden="true"
                    className="mb-[4px] min-w-4 flex-1 border-b border-dotted border-hairline transition-colors group-hover:border-ink-muted"
                  />
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </FadeIn>

      {/* The document */}
      <div className="max-w-[70ch]">
        {updated ? <p className="micro-label mb-10">{updated}</p> : null}

        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <FadeIn key={section.heading}>
              <section id={anchorId(section.heading)} className="scroll-mt-28">
                <h2 className="font-display text-[1.3rem] leading-snug tracking-[-0.025em] text-ink">
                  {section.heading}
                </h2>
                <div className="mt-3.5 flex flex-col gap-3 border-t border-hairline pt-4">
                  {groupBlocks(section.blocks).map((r, i) => {
                    if (r.kind === "ul") {
                      return (
                        <ul key={i} className="flex flex-col gap-2 pl-0">
                          {r.items.map((item, j) => (
                            <li
                              key={j}
                              className="flex gap-3 text-[14px] leading-relaxed text-ink-muted"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-2.5 h-px w-3 shrink-0 bg-green/40"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (r.kind === "subheading") {
                      return (
                        <p key={i} className="micro-label mt-2 !text-ink">
                          {r.text}
                        </p>
                      );
                    }
                    return paragraphs(r.text).map((para, j) => (
                      <p
                        key={`${i}-${j}`}
                        className="text-[14px] leading-relaxed text-ink-muted"
                      >
                        {para}
                      </p>
                    ));
                  })}
                </div>
              </section>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
