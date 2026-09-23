/**
 * lib/admin/permissions.ts — the roles people can be given in the admin
 * panel and what each role may do.
 *
 * Pure data, safe to import from client components: the UI uses it to hide
 * controls a role can't use. It is NOT the security boundary — every page,
 * Server Action and route handler re-checks through lib/admin/auth.ts.
 *
 * Roles mirror how WordPress splits Administrator / Shop manager, with two
 * narrower roles for staff who only pack orders or only need to look.
 */

export const ROLES = ["owner", "manager", "fulfillment", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "dashboard.view",
  "reports.view",
  "orders.view",
  "orders.update",
  "orders.edit",
  "orders.notify",
  "orders.refund",
  "orders.export",
  "products.view",
  "products.edit",
  "customers.view",
  "activity.view",
  "team.manage",
  "settings.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_GROUPS = [
  "Dashboard",
  "Orders",
  "Products",
  "Customers",
  "Administration",
] as const;

export const PERMISSION_INFO: Record<
  Permission,
  { label: string; group: (typeof PERMISSION_GROUPS)[number] }
> = {
  "dashboard.view": { label: "Dashboard and order counts", group: "Dashboard" },
  "reports.view": { label: "Sales and revenue figures", group: "Dashboard" },
  "orders.view": { label: "View orders, notes and shipping details", group: "Orders" },
  "orders.update": { label: "Change order status and add private notes", group: "Orders" },
  "orders.edit": { label: "Edit billing and shipping addresses", group: "Orders" },
  "orders.notify": { label: "Email customers (notes to customer, order details)", group: "Orders" },
  "orders.refund": { label: "Record refunds", group: "Orders" },
  "orders.export": { label: "Export orders to CSV", group: "Orders" },
  "products.view": { label: "View products and stock levels", group: "Products" },
  "products.edit": { label: "Change stock levels", group: "Products" },
  "customers.view": { label: "View the customer list and spend", group: "Customers" },
  "activity.view": { label: "View the activity log", group: "Administration" },
  "team.manage": { label: "Invite people and manage their access", group: "Administration" },
  "settings.manage": { label: "WooCommerce connection and webhooks", group: "Administration" },
};

export const ROLE_INFO: Record<Role, { label: string; summary: string }> = {
  owner: {
    label: "Owner",
    summary: "Everything, including who has access and the WooCommerce connection.",
  },
  manager: {
    label: "Manager",
    summary: "Runs the store day to day: orders, refunds, stock, customers and sales.",
  },
  fulfillment: {
    label: "Fulfillment",
    summary: "Packs and ships: works orders and sees stock, but not sales figures or customer lists.",
  },
  viewer: {
    label: "Viewer",
    summary: "Read-only access to orders, products, customers and sales.",
  },
};

const GRANTS: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set(PERMISSIONS),
  manager: new Set(
    PERMISSIONS.filter((p) => p !== "team.manage" && p !== "settings.manage")
  ),
  fulfillment: new Set<Permission>([
    "dashboard.view",
    "orders.view",
    "orders.update",
    "orders.edit",
    "orders.notify",
    "products.view",
  ]),
  viewer: new Set<Permission>([
    "dashboard.view",
    "reports.view",
    "orders.view",
    "products.view",
    "customers.view",
  ]),
};

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role]?.has(permission) ?? false;
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value)
  );
}
