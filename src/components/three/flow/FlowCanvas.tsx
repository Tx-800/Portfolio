"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { flow, measureAnchors } from "@/components/three/flow/sync";
import { cn } from "@/lib/utils";
import { hasWebGL } from "@/lib/webgl";

const FlowScene = dynamic(() => import("@/components/three/flow/FlowScene"), { ssr: false });

/**
 * The scroll-synced canvas layer of the flow page. Must sit inside the page wrapper that has
 * `position: relative; overflow: clip` (FlowPage): `relative` makes it the canvas's positioning
 * context, `clip` stops the 1.5×-tall canvas from extending the page's scroll height.
 *
 * Sizing: the wrapper is 150lvh tall (1.5 × the LARGE viewport height, i.e. with the mobile
 * URL bar hidden), so its size never changes when the URL bar shows/hides: no canvas resizes
 * while scrolling. pad = 25% of the large viewport.
 *
 * Measuring: anchors are measured in document coordinates on mount, on resize, when fonts
 * load and whenever the page wrapper's size changes (ResizeObserver), never per frame.
 */
export function FlowCanvas({ screenshots }: { screenshots: Record<string, string> }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const el = wrapper.current;
    const root = el?.parentElement;
    if (!el || !root || !hasWebGL()) return;
    flow.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    flow.wrapper = el;

    const measure = () => {
      flow.vw = root.clientWidth;
      flow.vh = window.innerHeight;
      flow.canvasH = el.offsetHeight;
      flow.pad = flow.canvasH * (0.25 / 1.5);
      measureAnchors(root);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("resize", measure);
    void document.fonts.ready.then(measure);

    // Mount the 3D once the browser is idle (the HTML paints first).
    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => setElement(el), { timeout: 1200 }) : 0;
    if (!idle) setTimeout(() => setElement(el), 200);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      if (idle) window.cancelIdleCallback(idle);
    };
  }, []);

  return (
    <div
      ref={wrapper}
      aria-hidden="true"
      // Above the text (z-20) but never catching touches: the HTML underneath stays interactive.
      className={cn(
        "pointer-events-none absolute top-0 left-0 z-20 h-[150lvh] w-full will-change-transform transition-opacity duration-1000 ease-out",
        ready ? "opacity-100" : "opacity-0",
      )}
    >
      {element && <FlowScene screenshots={screenshots} onReady={onReady} />}
    </div>
  );
}
