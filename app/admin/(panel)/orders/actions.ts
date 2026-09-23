"use server";

/**
 * Order Server Actions. Each one checks the person's permission, writes to
 * WooCommerce, records who did it in the activity log, and refreshes the page.
 *
 * Status changes made here are also attributed inside WooCommerce with a
 * private order note ("… by Jane in the admin panel"), because every change
 * goes through a single API key — without the note, WP admin and the
 * WooCommerce app would only show the key's owner.
 */

import { refresh } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/admin/action-state";
import { actionError, formString } from "@/lib/admin/actions";
import { recordActivity } from "@/lib/admin/activity";
import { authorize } from "@/lib/admin/auth";
import { formatMoney, toDecimalString, toMinor } from "@/lib/admin/money";
import { BULK_STATUSES, statusMeta } from "@/lib/admin/order-status";
import { fieldErrors } from "@/lib/admin/validation";
import {
  addOrderNote,
  createRefund,
  deleteOrderNote,
  gatewaySupportsRefunds,
  getOrderStatuses,
  getOrderSummary,
  sendOrderDetails,
  updateOrderAddress,
  updateOrderStatus,
  updateOrdersStatus,
} from "@/lib/admin/woo/orders";

const ATTRIBUTION = "in the Primetime admin panel";

async function validStatus(status: string): Promise<{ slug: string; name: string } | null> {
  const statuses = await getOrderStatuses();
  return statuses.find((s) => s.slug === status) ?? null;
}

export async function changeOrderStatus(
  orderId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await authorize("orders.update");
    const target = await validStatus(formString(formData, "status"));
    if (!target) return fail("Choose a valid status.");
    const note = formString(formData, "note").trim().slice(0, 2000);

    const order = await getOrderSummary(orderId);
    if (!order) return fail("This order no longer exists in WooCommerce.");
    if (order.status === target.slug && !note) return ok("The order already has that status.");

    const before = statusMeta(order.status).label;
    if (order.status !== target.slug) await updateOrderStatus(orderId, target.slug);
    await addOrderNote(
      orderId,
      order.status !== target.slug
        ? `Status changed from ${before} to ${target.name} by ${user.name} ${ATTRIBUTION}.${note ? `\n\n${note}` : ""}`
        : `${note}\n\n(${user.name}, ${ATTRIBUTION})`,
      false
    );

    await recordActivity({
      actor: user,
      action: "order.status_changed",
      target: { type: "order", id: orderId },
      summary:
        order.status !== target.slug
          ? `Changed order #${order.number} from ${before} to ${target.name}`
          : `Added a private note to order #${order.number}`,
    });
    refresh();
    return ok(order.status !== target.slug ? `Order marked ${target.name}.` : "Note added.");
  } catch (err) {
    return actionError(err);
  }
}

export async function bulkUpdateStatus(orderIds: number[], status: string): Promise<ActionState> {
  try {
    const user = await authorize("orders.update");
    const ids = [...new Set(orderIds)].filter((id) => Number.isInteger(id) && id > 0).slice(0, 500);
    if (ids.length === 0) return fail("Select at least one order.");
    // Same bulk options as WP admin; other statuses are changed one order at a time.
    if (!(BULK_STATUSES as readonly string[]).includes(status)) return fail("Choose a valid status.");
    const target = await validStatus(status);
    if (!target) return fail("Choose a valid status.");

    const { updated, failed } = await updateOrdersStatus(ids, target.slug);
    if (updated.length) {
      const sample = updated.slice(0, 8).map((id) => `#${id}`).join(", ");
      await recordActivity({
        actor: user,
        action: "orders.bulk_status_changed",
        target: { type: "order", id: updated.join(",").slice(0, 200) },
        summary: `Marked ${updated.length} order${updated.length === 1 ? "" : "s"} ${target.name} (${sample}${updated.length > 8 ? ", …" : ""})`,
      });
    }
    refresh();
    if (failed.length) {
      return fail(
        `${updated.length} updated, ${failed.length} failed: ${failed
          .slice(0, 3)
          .map((f) => `#${f.id} ${f.message}`)
          .join("; ")}`
      );
    }
    return ok(`${updated.length} order${updated.length === 1 ? "" : "s"} marked ${target.name}.`);
  } catch (err) {
    return actionError(err);
  }
}

export async function addNote(orderId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const toCustomer = formString(formData, "audience") === "customer";
  try {
    const user = await authorize(toCustomer ? "orders.notify" : "orders.update");
    const note = formString(formData, "note").trim();
    if (!note) return fail("Write a note first.", { note: "The note is empty." });
    if (note.length > 4000) return fail("Keep notes under 4,000 characters.", { note: "Too long." });

    const order = await getOrderSummary(orderId);
    if (!order) return fail("This order no longer exists in WooCommerce.");

    await addOrderNote(orderId, toCustomer ? note : `${note}\n\n(${user.name}, ${ATTRIBUTION})`, toCustomer);
    await recordActivity({
      actor: user,
      action: toCustomer ? "order.customer_note_sent" : "order.note_added",
      target: { type: "order", id: orderId },
      summary: toCustomer
        ? `Emailed a note to the customer on order #${order.number}`
        : `Added a private note to order #${order.number}`,
    });
    refresh();
    return ok(toCustomer ? "Note sent to the customer." : "Private note added.");
  } catch (err) {
    return actionError(err);
  }
}

export async function removeNote(orderId: number, noteId: number): Promise<ActionState> {
  try {
    const user = await authorize("orders.update");
    await deleteOrderNote(orderId, noteId);
    await recordActivity({
      actor: user,
      action: "order.note_deleted",
      target: { type: "order", id: orderId },
      summary: `Deleted a note on order #${orderId}`,
    });
    refresh();
    return ok("Note deleted.");
  } catch (err) {
    return actionError(err);
  }
}

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

const addressSchema = z.object({
  firstName: text(100),
  lastName: text(100),
  company: text(150),
  address1: text(200),
  address2: text(200),
  city: text(100),
  state: text(100),
  postcode: text(20),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "Use the 2-letter country code, e.g. US."),
  phone: text(40),
  email: z.union([z.literal(""), z.email("Enter a valid email address.")]),
});

export async function saveAddress(
  orderId: number,
  kind: "billing" | "shipping",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await authorize("orders.edit");
    if (kind !== "billing" && kind !== "shipping") return fail("Unknown address.");
    const parsed = addressSchema.safeParse({
      firstName: formString(formData, "firstName"),
      lastName: formString(formData, "lastName"),
      company: formString(formData, "company"),
      address1: formString(formData, "address1"),
      address2: formString(formData, "address2"),
      city: formString(formData, "city"),
      state: formString(formData, "state"),
      postcode: formString(formData, "postcode"),
      country: formString(formData, "country"),
      phone: formString(formData, "phone"),
      email: formString(formData, "email").trim(),
    });
    if (!parsed.success) return fail("Fix the highlighted fields.", fieldErrors(parsed.error));

    const order = await getOrderSummary(orderId);
    if (!order) return fail("This order no longer exists in WooCommerce.");

    await updateOrderAddress(orderId, kind, parsed.data);
    await addOrderNote(orderId, `${kind === "billing" ? "Billing" : "Shipping"} address updated by ${user.name} ${ATTRIBUTION}.`, false);
    await recordActivity({
      actor: user,
      action: "order.address_updated",
      target: { type: "order", id: orderId },
      summary: `Updated the ${kind} address on order #${order.number}`,
    });
    refresh();
    return ok(`${kind === "billing" ? "Billing" : "Shipping"} address saved.`);
  } catch (err) {
    return actionError(err);
  }
}

export async function refundOrder(orderId: number, _prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await authorize("orders.refund");
    const order = await getOrderSummary(orderId);
    if (!order) return fail("This order no longer exists in WooCommerce.");

    const rawAmount = formString(formData, "amount").replace(/[$,\s]/g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(rawAmount)) {
      return fail("Enter the refund amount, e.g. 25.00.", { amount: "Enter an amount like 25.00." });
    }
    const amountMinor = toMinor(rawAmount);
    const remaining = order.totalMinor - order.refundedMinor;
    if (amountMinor <= 0) return fail("The refund must be more than zero.", { amount: "Must be more than zero." });
    if (amountMinor > remaining) {
      return fail(`You can refund at most ${formatMoney(remaining, order.currency)}.`, {
        amount: `At most ${formatMoney(remaining, order.currency)}.`,
      });
    }

    const reason = formString(formData, "reason").trim().slice(0, 500);
    const viaGateway = formString(formData, "method") === "gateway";
    if (viaGateway && !(await gatewaySupportsRefunds(order.paymentMethodId))) {
      return fail("This order's payment method can't refund automatically. Record a manual refund and return the money yourself.");
    }
    if (formString(formData, "confirm") !== "yes") {
      return fail("Tick the confirmation box to record the refund.", { confirm: "Required." });
    }

    await createRefund(orderId, {
      amount: toDecimalString(amountMinor),
      reason: reason ? `${reason} (${user.name})` : `Refund by ${user.name} ${ATTRIBUTION}`,
      viaGateway,
    });
    const amount = formatMoney(amountMinor, order.currency);
    await recordActivity({
      actor: user,
      action: "order.refunded",
      target: { type: "order", id: orderId },
      summary: `Refunded ${amount} on order #${order.number} (${viaGateway ? "through the payment gateway" : "recorded manually"})`,
    });
    refresh();
    return ok(
      viaGateway
        ? `${amount} refunded through the payment gateway.`
        : `${amount} refund recorded. Remember to return the money to the customer.`
    );
  } catch (err) {
    return actionError(err);
  }
}

export async function resendOrderDetails(orderId: number): Promise<ActionState> {
  try {
    const user = await authorize("orders.notify");
    const order = await getOrderSummary(orderId);
    if (!order) return fail("This order no longer exists in WooCommerce.");
    await sendOrderDetails(orderId);
    await recordActivity({
      actor: user,
      action: "order.details_sent",
      target: { type: "order", id: orderId },
      summary: `Emailed order details to the customer for order #${order.number}`,
    });
    refresh();
    return ok("Order details emailed to the customer.");
  } catch (err) {
    return actionError(err);
  }
}
