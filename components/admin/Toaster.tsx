"use client";

/**
 * Toaster — small, dependency-free notifications for the admin panel (new
 * orders, quick actions). Announced politely to screen readers; each toast
 * pauses its dismiss timer while hovered or focused.
 */

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastInput {
  title: string;
  description?: string;
  tone?: "info" | "success" | "error";
  action?: { label: string; href: string };
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<(toast: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((all) => [...all.slice(-3), { ...toast, id }]);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const close = () => onDismiss(toast.id);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), toast.durationMs ?? 6000);
    return () => clearTimeout(timer);
  }, [paused, onDismiss, toast.id, toast.durationMs]);

  const Icon = toast.tone === "error" ? CircleAlert : toast.tone === "success" ? CircleCheck : Info;

  return (
    <div
      role="status"
      className="soft-card pointer-events-auto flex items-start gap-3 p-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          "mt-0.5 size-[18px] shrink-0",
          toast.tone === "error" ? "text-error" : toast.tone === "success" ? "text-ok" : "text-green"
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{toast.description}</p>
        )}
        {toast.action && (
          <Link
            href={toast.action.href}
            onClick={close}
            className="mt-2 inline-block text-[13px] font-medium text-green underline-offset-4 hover:underline"
          >
            {toast.action.label}
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={close}
        className="-m-1 rounded-md p-1 text-ink-muted transition-colors hover:bg-muted hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
