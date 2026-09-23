/**
 * GET /api/admin/orders/export — the current orders list (same filters as
 * the page) as CSV, up to 5,000 orders. Requires orders.export; every export
 * is recorded in the activity log because it contains customer data.
 */

import { NextResponse, type NextRequest } from "next/server";
import { recordActivity } from "@/lib/admin/activity";
import { getCurrentUser } from "@/lib/admin/auth";
import { toDecimalString, toMinor } from "@/lib/admin/money";
import { parseOrderFilters } from "@/lib/admin/order-filters";
import { statusMeta } from "@/lib/admin/order-status";
import { can } from "@/lib/admin/permissions";
import { getCatalogIndex } from "@/lib/admin/woo/catalog-index";
import { toProblem, wooRequest } from "@/lib/admin/woo/client";
import { statusQuery } from "@/lib/admin/woo/orders";
import type { WooAddress, WooOrder } from "@/lib/admin/woo/types";

const MAX_ORDERS = 5000;
const PAGE_SIZE = 100;

/** Quote a CSV cell and neutralise spreadsheet formulas. */
function cell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function address(a: Partial<WooAddress> | undefined): string {
  if (!a) return "";
  return [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.company,
    a.address_1,
    a.address_2,
    [a.city, a.state, a.postcode].filter(Boolean).join(" "),
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

const HEADER = [
  "Order",
  "Date (UTC)",
  "Status",
  "Customer",
  "Email",
  "Phone",
  "Billing address",
  "Shipping address",
  "Items",
  "Item count",
  "Discount",
  "Shipping",
  "Tax",
  "Total",
  "Refunded",
  "Currency",
  "Payment method",
  "Transaction ID",
  "Created via",
  "Customer note",
];

export async function GET(request: NextRequest) {
  // Exports only start from the panel itself, never from a link on another site.
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Start the export from the admin panel." }, { status: 403 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!can(user.role, "orders.export")) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const { filters, ui } = await parseOrderFilters(params);

  try {
    const [index, status] = await Promise.all([getCatalogIndex(), statusQuery(filters.status)]);
    const lines: string[] = [HEADER.map(cell).join(",")];
    let exported = 0;

    for (let page = 1; exported < MAX_ORDERS; page++) {
      const res = await wooRequest<WooOrder[]>("/orders", {
        query: {
          status,
          search: filters.search,
          after: filters.after,
          before: filters.before,
          dates_are_gmt: filters.after || filters.before ? true : undefined,
          page,
          per_page: PAGE_SIZE,
          orderby: "date",
          order: "desc",
        },
        timeoutMs: 45_000,
      });
      for (const o of res.data) {
        const items = (o.line_items ?? [])
          .map((i) => `${index.productName(i.product_id, i.parent_name || i.name)} x ${i.quantity}`)
          .join("; ");
        const refunded = (o.refunds ?? []).reduce((sum, r) => sum + Math.abs(toMinor(r.total)), 0);
        lines.push(
          [
            o.number || o.id,
            o.date_created_gmt ?? "",
            statusMeta(o.status).label,
            index.code([o.billing?.first_name, o.billing?.last_name].filter(Boolean).join(" ")),
            o.billing?.email ?? "",
            o.billing?.phone ?? "",
            index.code(address(o.billing)),
            index.code(address(o.shipping)),
            items,
            (o.line_items ?? []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
            o.discount_total,
            o.shipping_total,
            o.total_tax,
            o.total,
            toDecimalString(refunded),
            o.currency,
            o.payment_method_title,
            o.transaction_id,
            o.created_via,
            index.code(o.customer_note ?? ""),
          ]
            .map(cell)
            .join(",")
        );
        exported++;
      }
      if (!res.totalPages || page >= res.totalPages || res.data.length === 0) break;
    }

    await recordActivity({
      actor: user,
      action: "orders.exported",
      target: { type: "store", id: "orders" },
      summary: `Exported ${exported} order${exported === 1 ? "" : "s"} to CSV${ui.status !== "all" ? ` (${statusMeta(ui.status).label})` : ""}${ui.q ? ` matching “${ui.q}”` : ""}`,
    });

    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(`﻿${lines.join("\r\n")}\r\n`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${stamp}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: toProblem(err).message }, { status: 502 });
  }
}
