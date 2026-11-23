"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { useEffect } from "react";
import { useAnchorLinks } from "@/hooks/useAnchorLinks";
import { useJourneyScroll } from "@/hooks/useJourneyScroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const LENIS_OPTIONS: LenisOptions = {
  autoRaf: false, // GSAP's ticker drives Lenis (see LenisGsapBridge) so both share one frame loop.
  lerp: 0.1, // Smoothing: lower = floatier.
  smoothWheel: true,
  syncTouch: false, // Native touch scrolling on phones; it feels better than emulated inertia.
  stopInertiaOnNavigate: true,
};

/**
 * Mounts smooth scrolling + the scroll engine for the journey page. Renders nothing visible.
 * With reduced motion, Lenis is skipped entirely (native scroll); the engine still runs so
 * the chapter rail keeps working.
 */
export function ScrollEngine() {
  const reducedMotion = usePrefersReducedMotion();
  useJourneyScroll();
  useAnchorLinks();

  if (reducedMotion) return null;
  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      <LenisGsapBridge />
    </ReactLenis>
  );
}

/** Keeps Lenis and ScrollTrigger in lock-step on a single requestAnimationFrame loop. */
function LenisGsapBridge() {
  // The callback runs on every Lenis scroll event → ScrollTrigger re-reads the position.
  const lenis = useLenis(ScrollTrigger.update);

  useEffect(() => {
    if (!lenis) return;
    // gsap.ticker passes seconds; Lenis wants milliseconds.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Don't let GSAP "catch up" after a dropped frame; that would make the scroll jump.
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, [lenis]);

  return null;
}
