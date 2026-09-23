/**
 * TrustStrip — the white strip under the hero: four short trust lines, each
 * behind a cobalt dot. Copy: redesignHome.trustStrip. Server component.
 */

import { redesignHome } from "@/content/site-copy";
import { CONTAINER } from "./parts";
import { cn } from "@/lib/utils";

export function TrustStrip() {
  return (
    <section className="border-b border-rule bg-white">
      <ul
        className={cn(
          CONTAINER,
          "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-6 gap-y-3 py-4 text-[14px] font-semibold text-navy"
        )}
      >
        {redesignHome.trustStrip.map((line) => (
          <li key={line} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-full bg-cobalt"
            />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
