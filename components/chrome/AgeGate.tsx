"use client";

/**
 * AgeGate — the full-screen deep-green admittance card (DESIGN §7.0):
 * wordmark, heading, the TWO verbatim checkboxes (age + research-use), the
 * role <select>, Accept (green) / Decline (text). Set to 18+ — the spec
 * corrects the live store's internal 21-vs-18 inconsistency to 18 (Terms §2 +
 * Privacy §9), so the verbatim age line renders with 18.
 *
 * CRAWLER-SAFE BY DESIGN: this is a client component that renders ON TOP of
 * fully-SSR'd page content. There is NO middleware/proxy blocking and NO
 * conditional page rendering — crawlers and users without JS always receive
 * the complete DOM. The overlay only appears after mount (hydration-safe:
 * renders null until the localStorage/cookie check has run), so confirmed
 * visitors never see a flash.
 *
 * NOTE: never put `paper-grain`/`plate` (unlayered `position:relative` rules)
 * on the fixed wrapper itself — unlayered CSS beats Tailwind's layered
 * `fixed` utility and the overlay collapses into document flow.
 *
 * Confirmation persists as localStorage `pt_age_ok` + a 1-year cookie of the
 * same name (cookie provided so a future server layer can also read it).
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { brandConfig } from "@/content/brand-config";
import { compliance } from "@/content/compliance";
import { ageGate } from "@/content/site-copy";
import { D1_EASE } from "@/components/motion/FadeIn";

const STORAGE_KEY = "pt_age_ok";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Verbatim age line with the spec-mandated 21 → 18 correction (DESIGN §7.0). */
const CONFIRM_AGE_18 = ageGate.confirmAge.replace("21", "18");

function isConfirmed(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "1") return true;
  } catch {
    // localStorage unavailable — fall through to cookie check
  }
  return document.cookie
    .split("; ")
    .some((c) => c === `${STORAGE_KEY}=1`);
}

function persistConfirmation(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // localStorage unavailable — cookie below still persists it
  }
  document.cookie = `${STORAGE_KEY}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

/* useSyncExternalStore wiring — the sanctioned hydration-safe way to read a
   client-only value: the server snapshot says "confirmed" (renders nothing),
   the client snapshot reads storage after hydration. */
const subscribeNoop = () => () => {};
const getClientConfirmed = () => isConfirmed();
const getServerConfirmed = () => true;

export function AgeGate() {
  const confirmed = useSyncExternalStore(
    subscribeNoop,
    getClientConfirmed,
    getServerConfirmed
  );
  // Set by the Accept button (storage writes don't re-trigger the store).
  const [dismissed, setDismissed] = useState(false);
  const [ageOk, setAgeOk] = useState(false);
  const [useOk, setUseOk] = useState(false);
  const reduced = useReducedMotion();

  const visible = !confirmed && !dismissed;
  const canAccept = ageOk && useOk;

  // Lock page scroll while the gate is up.
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  if (!visible) return null;

  const accept = () => {
    if (!canAccept) return;
    persistConfirmation();
    setDismissed(true);
  };

  const decline = () => {
    window.location.href = "https://google.com";
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-green-deep"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      {/* paper-grain lives on this INNER wrapper (it is position:relative by
          design) — the fixed outer must stay free of unlayered position rules. */}
      <div className="paper-grain flex min-h-full items-center justify-center px-4 py-10">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: D1_EASE }}
          className="plate w-full max-w-md"
        >
          {/* Soft admittance card — 20px radius (band-inner container scale),
              the layered soft shadow does the framing (crop marks retired). */}
          <div className="plate-field [--plate-radius:20px] bg-surface p-7 md:p-9">
            {/* Brand roundel + wordmark */}
            <Image
              src="/brand/logo.png"
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              className="size-14"
            />
            <p className="font-display mt-3.5 text-[20px] font-bold tracking-[-0.02em] text-ink">
              {brandConfig.name}
            </p>
            <p className="micro-label mt-1.5 !text-[9.5px]">
              Reference-Grade Peptides
            </p>

            <div className="hairline-rule my-5" />

            <p className="micro-label">Access Verification</p>
            <h2
              id="age-gate-title"
              className="font-display mt-2.5 text-[1.9rem] leading-[1.05] tracking-[-0.025em] text-ink"
            >
              Research use only.
            </h2>
            {/* Verbatim ageGate.subtext */}
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
              {ageGate.subtext}
            </p>

            <p className="warn-line mt-4 inline-block rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink">
              {compliance.ruoBanner}
            </p>

            {/* The two verbatim confirmation checkboxes (DESIGN §7.0). */}
            <div className="mt-5 flex flex-col gap-3.5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={ageOk}
                  onCheckedChange={(v) => setAgeOk(v === true)}
                  aria-label={CONFIRM_AGE_18}
                  className="mt-0.5"
                />
                <span className="text-[13.5px] leading-snug text-ink">
                  {CONFIRM_AGE_18}
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={useOk}
                  onCheckedChange={(v) => setUseOk(v === true)}
                  aria-label={ageGate.confirmUse}
                  className="mt-0.5"
                />
                <span className="text-[13.5px] leading-snug text-ink">
                  {ageGate.confirmUse}
                </span>
              </label>
            </div>

            {/* Role select — verbatim options (DESIGN §7.0). */}
            <div className="mt-5">
              <label htmlFor="age-gate-role" className="micro-label">
                Research role
              </label>
              <select
                id="age-gate-role"
                defaultValue={ageGate.roleOptions[0]}
                className="mt-1.5 h-10 w-full rounded-lg border border-hairline bg-surface px-3 text-[14px] text-ink"
              >
                {ageGate.roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-7 flex flex-col gap-2.5">
              <Button
                className="h-11 w-full"
                onClick={accept}
                disabled={!canAccept}
              >
                {ageGate.acceptLabel}
              </Button>
              <Button variant="ghost" className="h-11 w-full" onClick={decline}>
                {ageGate.declineLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
