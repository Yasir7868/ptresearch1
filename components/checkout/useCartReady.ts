"use client";

import { useEffect, useState } from "react";

/**
 * True once the cart's localStorage hydration has had a chance to land.
 *
 * CartProvider hydrates in an effect (load() resolves in a microtask after
 * mount), so on first paint `items` is always []. Gating empty states behind
 * this hook (a macrotask after mount) prevents a one-frame "your cart is
 * empty" flash on /cart and /checkout for returning visitors.
 */
export function useCartReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  return ready;
}
