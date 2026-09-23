"use client";

/**
 * LiveOrders — keeps an open admin tab current, the way the WooCommerce app
 * does with push notifications.
 *
 * Every 30 seconds (while the tab is visible) it asks /api/admin/orders/latest
 * for the newest orders and the status counts. New orders raise a toast (and
 * a desktop notification when the person turned those on in their account),
 * the sidebar counts update, and the dashboard refreshes itself. With
 * WooCommerce webhooks connected the server answers from fresh data; without
 * them it reads WooCommerce directly (briefly cached).
 */

import { useRouter, usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { formatMoney } from "@/lib/admin/money";
import { useToast } from "./Toaster";

export interface LatestOrderSignal {
  id: number;
  number: string;
  customerName: string;
  totalMinor: number;
  currency: string;
}

export interface PollResponse {
  counts: Record<string, number> | null;
  latest: LatestOrderSignal[];
}

const CountsContext = createContext<Record<string, number> | null>(null);

export function useLiveCounts() {
  return useContext(CountsContext);
}

export const DESKTOP_ALERTS_KEY = "pt_admin_desktop_alerts";

const VISIBLE_INTERVAL_MS = 30_000;
const HIDDEN_INTERVAL_MS = 60_000;

function desktopAlertsOn(): boolean {
  try {
    return (
      localStorage.getItem(DESKTOP_ALERTS_KEY) === "1" &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    );
  } catch {
    return false;
  }
}

export function LiveOrdersProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  // Null until the first poll, which only records the newest id (no toasts
  // for orders that already existed when the tab opened).
  const lastSeenId = useRef<number | null>(null);
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const schedule = () => {
      if (stopped) return;
      const hidden = document.visibilityState !== "visible";
      if (hidden && !desktopAlertsOn()) return; // resume on visibilitychange
      timer = setTimeout(poll, hidden ? HIDDEN_INTERVAL_MS : VISIBLE_INTERVAL_MS);
    };

    async function poll() {
      try {
        const res = await fetch("/api/admin/orders/latest", { cache: "no-store" });
        if (res.status === 401 || res.status === 403) {
          stopped = true;
          return;
        }
        if (res.ok) {
          const data = (await res.json()) as PollResponse;
          if (data.counts) setCounts(data.counts);
          announce(data.latest);
        }
      } catch {
        // Offline or a deploy in progress: try again next tick.
      }
      schedule();
    }

    function announce(latest: LatestOrderSignal[]) {
      const newestId = latest.reduce((max, o) => Math.max(max, o.id), 0);
      if (lastSeenId.current === null) {
        lastSeenId.current = newestId;
        return;
      }
      const fresh = latest.filter((o) => o.id > (lastSeenId.current ?? 0)).sort((a, b) => a.id - b.id);
      if (fresh.length === 0) return;
      lastSeenId.current = Math.max(lastSeenId.current, newestId);

      for (const order of fresh.slice(-3)) {
        const description = `${order.customerName} · ${formatMoney(order.totalMinor, order.currency)}`;
        toast({
          title: `New order #${order.number}`,
          description,
          tone: "success",
          action: { label: "View order", href: `/admin/orders/${order.id}` },
          durationMs: 12_000,
        });
        if (document.visibilityState !== "visible" && desktopAlertsOn()) {
          try {
            new Notification(`New order #${order.number}`, { body: description, tag: `order-${order.id}` });
          } catch {
            // Some browsers only allow notifications from a service worker.
          }
        }
      }
      if (pathRef.current === "/admin") router.refresh();
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void poll();
      }
    };

    void poll();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, router, toast]);

  return <CountsContext.Provider value={counts}>{children}</CountsContext.Provider>;
}
