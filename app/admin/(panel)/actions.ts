"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/admin/activity";
import { authorize, getCurrentUser } from "@/lib/admin/auth";
import { invalidate } from "@/lib/admin/memo";
import { endSession } from "@/lib/admin/session";

export async function signOut(): Promise<void> {
  const user = await getCurrentUser();
  await endSession();
  if (user) {
    await recordActivity({ actor: user, action: "auth.signed_out", target: { type: "account", id: user.id }, summary: "Signed out" });
  }
  redirect("/admin/login");
}

/** Drop cached WooCommerce figures and re-render with fresh data. */
export async function refreshStoreData(): Promise<void> {
  await authorize("dashboard.view");
  invalidate("orders", "products", "statuses", "settings");
  refresh();
}
