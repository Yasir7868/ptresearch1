"use client";

/**
 * AgeGate — the full-screen deep-green admittance card (DESIGN §7.0) carrying
 * the live site's age-gate popup copy verbatim: heading, terms line, the TWO
 * checkboxes (21+ age + research-use), the unlabeled role <select>, Accept /
 * Decline, and the closing disclaimer. The live gate says 21 while Terms §2 and
 * Privacy §9 say 18 — the gate copy is kept as published.
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

            <div className="hairline-rule my-5" />

            <h2
              id="age-gate-title"
              className="font-display text-[1.45rem] leading-[1.15] tracking-[-0.02em] text-ink"
            >
              {ageGate.heading}
            </h2>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
              {ageGate.subtext}
            </p>

            {/* The two verbatim confirmation checkboxes. */}
            <div className="mt-5 flex flex-col gap-3.5">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={ageOk}
                  onCheckedChange={(v) => setAgeOk(v === true)}
                  aria-label={ageGate.confirmAge}
                  className="mt-0.5"
                />
                <span className="text-[13.5px] leading-snug text-ink">
                  {ageGate.confirmAge}
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

            {/* Role select — verbatim options. Unlabeled on the live site; the
                screen-reader name follows its live id ("researchType"). */}
            <div className="mt-5">
              <select
                aria-label="Research type"
                defaultValue={ageGate.roleOptions[0]}
                className="h-10 w-full rounded-lg border border-hairline bg-surface px-3 text-[14px] text-ink"
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

            <p className="warn-line mt-6 rounded-md px-3 py-2.5 text-[12px] leading-relaxed text-ink">
              {compliance.ageGateDisclaimer}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
