/**
 * GET /api/admin/orders/latest — polled every 30s by open admin tabs
 * (components/admin/LiveOrders.tsx) for the newest orders and status counts.
 * Answers from a few seconds of memoized data, which webhooks clear.
 */

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { toProblem } from "@/lib/admin/woo/client";
import { getLatestOrders, getStatusCounts } from "@/lib/admin/woo/orders";
import type { PollResponse } from "@/components/admin/LiveOrders";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401, headers: NO_STORE });
  if (!can(user.role, "orders.view")) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403, headers: NO_STORE });
  }

  try {
    const [counts, latest] = await Promise.all([getStatusCounts(), getLatestOrders(5)]);
    const body: PollResponse = {
      counts,
      latest: latest.map((o) => ({
        id: o.id,
        number: o.number,
        customerName: o.customerName,
        totalMinor: o.totalMinor,
        currency: o.currency,
      })),
    };
    return NextResponse.json(body, { headers: NO_STORE });
  } catch (err) {
    const problem = toProblem(err);
    return NextResponse.json({ error: problem.message }, { status: 502, headers: NO_STORE });
  }
}
