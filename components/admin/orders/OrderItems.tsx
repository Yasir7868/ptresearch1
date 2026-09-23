import Image from "next/image";
import { formatMoney } from "@/lib/admin/money";
import type { OrderView } from "@/lib/admin/woo/orders";

/** Line items and the totals ledger, as WooCommerce calculated them. */
export function OrderItems({ order }: { order: OrderView }) {
  const money = (minor: number) => formatMoney(minor, order.currency);
  const t = order.totals;

  return (
    <div>
      {/* Phones: stacked lines */}
      <ul className="divide-y divide-hairline/70 md:hidden">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-paper">
              {item.image && <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{item.name}</span>
              {item.variant && <span className="block text-[12.5px] text-ink-muted">{item.variant}</span>}
              <span className="data-num block text-[13px] text-ink-muted">
                {item.quantity} × {money(item.unitMinor)}
              </span>
            </span>
            <span className="data-num shrink-0 text-sm font-medium text-ink">{money(item.totalMinor)}</span>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="ledger-table min-w-[520px]">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col" className="num">Price</th>
              <th scope="col" className="num">Qty</th>
              <th scope="col" className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-paper">
                      {item.image && <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{item.name}</span>
                      {item.variant && <span className="block text-[12.5px] text-ink-muted">{item.variant}</span>}
                      {item.sku && <span className="batch-id text-ink-muted">{item.sku}</span>}
                    </span>
                  </div>
                </td>
                <td className="num text-ink-muted">{money(item.unitMinor)}</td>
                <td className="num">× {item.quantity}</td>
                <td className="num">
                  {item.subtotalMinor !== item.totalMinor && (
                    <span className="block text-[12px] text-ink-muted line-through">{money(item.subtotalMinor)}</span>
                  )}
                  {money(item.totalMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto flex max-w-sm flex-col gap-2 border-t border-hairline/70 px-5 py-4 text-sm">
        <Row label="Items subtotal" value={money(t.itemsSubtotalMinor)} />
        {order.couponLines.length > 0 && (
          <Row
            label={`Coupon${order.couponLines.length > 1 ? "s" : ""}: ${order.couponLines.map((c) => c.code.toUpperCase()).join(", ")}`}
            value={`−${money(t.discountMinor)}`}
          />
        )}
        {order.couponLines.length === 0 && t.discountMinor > 0 && <Row label="Discount" value={`−${money(t.discountMinor)}`} />}
        {order.shippingLines.map((line) => (
          <Row key={line.id} label={`Shipping: ${line.title}`} value={money(line.totalMinor)} />
        ))}
        {order.feeLines.map((line) => (
          <Row key={line.id} label={line.name} value={money(line.totalMinor)} />
        ))}
        {t.taxMinor > 0 && <Row label="Tax" value={money(t.taxMinor)} />}
        <Row label="Order total" value={money(t.totalMinor)} strong />
        {t.refundedMinor > 0 && (
          <>
            <Row label="Refunded" value={`−${money(t.refundedMinor)}`} tone="error" />
            <Row label="Net payment" value={money(t.netMinor)} strong />
          </>
        )}
      </dl>
    </div>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "error" }) {
  return (
    <div className={strong ? "flex justify-between gap-4 border-t border-hairline/70 pt-2" : "flex justify-between gap-4"}>
      <dt className={strong ? "font-semibold text-ink" : "text-ink-muted"}>{label}</dt>
      <dd className={`data-num text-right ${strong ? "font-semibold text-ink" : tone === "error" ? "text-error" : "text-ink"}`}>
        {value}
      </dd>
    </div>
  );
}
