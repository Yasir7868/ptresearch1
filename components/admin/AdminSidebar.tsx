"use client";

/**
 * AdminSidebar — brand, navigation and the account menu, on the navy band
 * (same color contract as the storefront footer: mist-blue type, orange only
 * as a graphic mark). Rendered as the fixed desktop sidebar and inside the
 * mobile menu sheet. Items a role can't use are hidden; the pages themselves
 * still enforce access.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  ShoppingBag,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { can, type Permission, type Role } from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";
import { useLiveCounts } from "./LiveOrders";
import { UserMenu } from "./UserMenu";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
  /** Status whose count is shown as a badge. */
  badgeStatus?: string;
}

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Store",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders.view", badgeStatus: "processing" },
      { href: "/admin/site-orders", label: "Storefront orders", icon: Receipt, permission: "orders.view" },
      { href: "/admin/products", label: "Products", icon: Package, permission: "products.view" },
      { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/admin/team", label: "Team", icon: UserCog, permission: "team.manage" },
      { href: "/admin/activity", label: "Activity", icon: History, permission: "activity.view" },
      { href: "/admin/settings", label: "Settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  user,
  storeUrl,
  wpAdminUrl,
  onNavigate,
}: {
  user: { name: string; email: string; role: Role };
  storeUrl: string;
  wpAdminUrl: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const counts = useLiveCounts();

  return (
    <div className="band-green flex h-full flex-col">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 pt-6 pb-5 focus-visible:outline-offset-[-2px]"
      >
        <Image src="/brand/logo-footer.png" alt="" width={34} height={34} className="size-[34px]" />
        <span className="flex flex-col">
          <span className="text-[15px] leading-tight font-semibold tracking-[-0.01em] text-[var(--mint-bright)]">
            Primetime Research
          </span>
          <span className="micro-label-dark mt-0.5">Admin panel</span>
        </span>
      </Link>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((group) => {
          const items = group.items.filter((item) => can(user.role, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mt-5 first:mt-1">
              <p className="micro-label-dark px-3 pb-1.5">{group.label}</p>
              <ul className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const badge = item.badgeStatus ? (counts?.[item.badgeStatus] ?? 0) : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex h-9 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors focus-visible:outline-offset-[-2px]",
                          active
                            ? "bg-white/10 text-[var(--mint-bright)]"
                            : "text-mint/80 hover:bg-white/[0.06] hover:text-[var(--mint-bright)]"
                        )}
                      >
                        {active && (
                          <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-amber" />
                        )}
                        <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="data-num rounded-full bg-mint px-2 py-px text-[11.5px] font-semibold text-band">
                            {badge}
                            <span className="sr-only"> {item.badgeStatus}</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <UserMenu user={user} storeUrl={storeUrl} wpAdminUrl={wpAdminUrl} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
