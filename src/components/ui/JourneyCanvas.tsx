"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import { screenDevice } from "@/lib/device";
import { hasWebGL } from "@/lib/webgl";
import { uiStore } from "@/store/ui";

// three.js + R3F live in this chunk; it's only downloaded once we decide to show the 3D.
const Experience = dynamic(() => import("@/components/three/Experience"), { ssr: false });

/**
 * Loads the 3D world after the HTML has painted (when the browser is idle), then fades it in.
 * Skipped entirely with reduced motion or without WebGL: the HTML journey stands on its own.
 */
export function JourneyCanvas({ screenshots }: { screenshots: Record<string, string> }) {
  const reducedMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => {
    setReady(true);
    uiStore.setState({ sceneReady: true });
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    // A phone-class screen got the desktop page by mistake: DeviceSwitch is about to swap in the
    // Data Core, so never start downloading the desktop stations.
    if (screenDevice() === "mobile") return;
    if (!hasWebGL()) {
      // Collapses the travel gaps (globals.css) so the page reads like the Classic View.
      document.documentElement.dataset.webgl = "off";
      return;
    }
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setMounted(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(id);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    // #stage is always rendered (the scroll engine measures it from the first frame).
    // Desktop: the full-screen layer behind the page. Mobile stage mode: an opaque band fixed to
    // the top 55svh ABOVE the content, so text never sits over the 3D; the engine slides it up
    // (transform) while long content scrolls past.
    <div
      id="stage"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 will-change-transform stage:bottom-auto stage:z-20 stage:h-[55svh] stage:bg-bg"
    >
      {mounted && (
        <div className={cn("absolute inset-0 transition-opacity duration-[1400ms] ease-out", ready ? "opacity-100" : "opacity-0")}>
          <Experience onReady={onReady} screenshots={screenshots} />
        </div>
      )}
      {/* Stage mode: soft fade where the stage meets the content card below it. */}
      <div className="absolute inset-x-0 bottom-0 hidden h-10 bg-linear-to-t from-bg to-transparent stage:block" />
      <div className="absolute inset-x-0 bottom-0 hidden h-px bg-linear-to-r from-transparent via-border-strong to-transparent stage:block" />
    </div>
  );
}
