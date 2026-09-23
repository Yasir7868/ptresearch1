/**
 * LineMeta — the label/value pairs a cart line carries (lib/cart.tsx →
 * CartItemMeta). Today that is the gift card's recipient, message and
 * delivery date, so the buyer can see who each card is for in the drawer, on
 * /cart, at checkout and on the receipt — the way WooCommerce prints its cart
 * item data under the product name.
 *
 * Shared by all four surfaces for the same reason TotalsLedger is: they can
 * never drift. Renders nothing on an ordinary product line. Plain component,
 * no hooks — safe in the Server Components on /order-received.
 */

import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/cart";

export function LineMeta({
  item,
  className,
}: {
  item: Pick<CartItem, "meta">;
  className?: string;
}) {
  if (!item.meta || item.meta.length === 0) return null;

  return (
    <dl className={cn("mt-1 flex flex-col gap-0.5 text-[11px] leading-snug", className)}>
      {item.meta.map((entry) => (
        <div key={`${entry.label}-${entry.value}`} className="flex gap-1.5">
          <dt className="shrink-0 text-ink-muted">{entry.label}</dt>
          {/* A short message can run long — wrap it rather than clipping it. */}
          <dd className="min-w-0 break-words text-ink">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
