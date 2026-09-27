"use client";

/**
 * HeroVideo — the hero's background film: the landscape cut on desktop, the
 * portrait cut on phones (owner-supplied, 10s, silent).
 *
 * ONE FILE PER DEVICE. The source is chosen from matchMedia rather than by
 * rendering both and hiding one, which would put 6.6MB on the wire for a
 * 3MB-visible result. `useSyncExternalStore` does the choosing: its server
 * snapshot is null, so nothing renders (and nothing downloads) until the
 * client knows the width, and a resize across the breakpoint swaps the file.
 *
 * Decorative: muted, looping, `playsInline` (iOS plays inline instead of
 * going fullscreen), and hidden from assistive tech. Under reduced motion the
 * same element renders without autoplay and with `preload="none"`, so it
 * holds the poster frame and never fetches the film. The poster is a real
 * frame, so that state — and any browser that blocks autoplay — still shows
 * the scene rather than a black rectangle.
 */

import { useCallback, useSyncExternalStore } from "react";

const DESKTOP = {
  src: "/videos/hero-desktop.mp4",
  poster: "/images/home/hero-desktop-poster.webp",
};
const MOBILE = {
  src: "/videos/hero-mobile.mp4",
  poster: "/images/home/hero-mobile-poster.webp",
};

/** Matches the `md:` breakpoint, where the hero switches to the wide layout. */
const DESKTOP_QUERY = "(min-width: 768px)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [
    window.matchMedia(DESKTOP_QUERY),
    window.matchMedia(REDUCED_QUERY),
  ];
  for (const query of queries) query.addEventListener("change", onChange);
  return () => {
    for (const query of queries) query.removeEventListener("change", onChange);
  };
}

export function HeroVideo({ className }: { className?: string }) {
  // A plain string, so repeat reads compare equal (useSyncExternalStore
  // re-reads on every render and would loop on a fresh object).
  const getSnapshot = useCallback(() => {
    const wide = window.matchMedia(DESKTOP_QUERY).matches ? "desktop" : "mobile";
    const still = window.matchMedia(REDUCED_QUERY).matches;
    return still ? `${wide}-still` : wide;
  }, []);
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (mode === null) return null;

  const { src, poster } = mode.startsWith("desktop") ? DESKTOP : MOBILE;
  const still = mode.endsWith("-still");

  return (
    <video
      key={`${src}${still ? "-still" : ""}`}
      src={src}
      poster={poster}
      autoPlay={!still}
      muted
      loop
      playsInline
      preload={still ? "none" : "auto"}
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
