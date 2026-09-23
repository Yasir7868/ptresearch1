import { requireUser } from "@/lib/admin/auth";
import { wpOrigin } from "@/lib/admin/config";
import { can } from "@/lib/admin/permissions";
import { isWooConfigured } from "@/lib/admin/woo/client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LiveOrdersProvider } from "@/components/admin/LiveOrders";
import { MobileTopBar } from "@/components/admin/MobileTopBar";
import { ToastProvider } from "@/components/admin/Toaster";

/**
 * The signed-in admin shell. The session check here decides what chrome to
 * render; each page still calls requirePermission() itself, because layouts
 * don't re-run on client-side navigation.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const shell = {
    user: { name: user.name, email: user.email, role: user.role },
    storeUrl: "/",
    wpAdminUrl: `${wpOrigin()}/wp-admin/`,
  };

  return (
    <ToastProvider>
      <LiveOrdersProvider enabled={can(user.role, "orders.view") && isWooConfigured()}>
        <a
          href="#admin-main"
          className="sr-only z-50 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-ink shadow-md focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
          <AdminSidebar {...shell} />
        </aside>
        <div className="min-h-dvh lg:pl-64">
          <MobileTopBar {...shell} />
          <main id="admin-main" className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
            {children}
          </main>
        </div>
      </LiveOrdersProvider>
    </ToastProvider>
  );
}
