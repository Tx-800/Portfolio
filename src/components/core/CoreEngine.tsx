"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { beatLook, beatZ, CHAPTERS, chapterStart, core, distanceAt, GATES, measureView, MORPH_HALF, ramp, STOPS, TOTAL, type StopId } from "@/components/core/timeline";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isStageMode } from "@/lib/stageMode";
import { cn } from "@/lib/utils";
import { hasWebGL } from "@/lib/webgl";
import { uiStore } from "@/store/ui";

// three.js + R3F live in this chunk; downloaded only in stage mode, once the HTML has painted.
const CoreCanvas = dynamic(() => import("@/components/three/core/CoreCanvas"), { ssr: false });

declare global {
  interface Window {
    /** Read by the screenshot script. */
    __core?: {
      t: () => number;
      total: number;
      scrollFor: (t: number) => number;
      circle: () => { x: number; y: number; r: number };
      holds: { id: string; t: number }[];
      gates: number[];
      morphHalf: number;
    };
  }
}

interface BeatEl {
  el: HTMLElement;
  anchor: number;
  sats: { el: HTMLElement; sx: number; sy: number; w: number }[];
  last: number;
}

/**
 * The single clock of the Data Core layout (see timeline.ts for the big picture):
 *   scroll → ScrollTrigger (scrubbed) → t → s → beats (depth, opacity, blur) + satellites +
 *   progress UI → render the 3D with the same values.
 * Does nothing outside stage mode (reduced motion / desktop / no WebGL: the stacked layout).
 */
export function CoreEngine({ screenshots }: { screenshots: Record<string, string> }) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isStageMode()) {
      if (!hasWebGL()) document.documentElement.dataset.webgl = "off";
      return;
    }
    const track = document.querySelector<HTMLElement>("[data-core-track]");
    const stage = document.querySelector<HTMLElement>("[data-core-stage]");
    if (!track || !stage) return;

    // 1. SCROLL → t. A tween from 0 to TOTAL scrubbed by the track's scroll range. `scrub: 0.7`
    //    = t glides to the scrollbar's position over 0.7 s: the camera gets weight and inertia,
    //    while native touch scrolling stays untouched.
    const proxy = { t: 0 };
    const tween = gsap.to(proxy, {
      t: TOTAL,
      ease: "none",
      scrollTrigger: { trigger: track, start: "top top", end: "bottom bottom", scrub: 0.7 },
    });
    const trigger = tween.scrollTrigger as ScrollTrigger;

    const anchors = new Map(STOPS.map((stop) => [stop.id, stop.anchor]));
    const beats: BeatEl[] = Array.from(document.querySelectorAll<HTMLElement>("[data-beat]")).map((el) => ({
      el,
      anchor: anchors.get(el.dataset.beat as StopId) ?? 0,
      sats: Array.from(el.querySelectorAll<HTMLElement>("[data-sat]")).map((sat) => ({ el: sat, sx: Number(sat.dataset.sx), sy: Number(sat.dataset.sy), w: 0 })),
      last: -1,
    }));
    const bar = document.querySelector<HTMLElement>("[data-core-bar]");
    const count = document.querySelector<HTMLElement>("[data-core-count]");
    const hint = document.querySelector<HTMLElement>("[data-core-hint]");
    let lastChapter = -1;
    let lastTime = 0;
    let size = "";

    // 2. ONE CALLBACK PER FRAME.
    const tick = (time: number) => {
      // Screen geometry (cheap reads; the maths only reruns when something changed).
      const key = `${stage.clientWidth}x${stage.clientHeight}x${window.innerHeight}`;
      if (key !== size) {
        size = key;
        measureView(stage.clientWidth, stage.clientHeight, Math.min(window.innerHeight, stage.clientHeight));
        stage.style.setProperty("--core-r", `${core.coreRadiusPx.toFixed(1)}px`);
        // Satellite widths, read once per size change (never per frame: no layout thrashing).
        for (const b of beats) for (const sat of b.sats) sat.w = sat.el.offsetWidth;
      }

      const t = proxy.t;
      const s = distanceAt(t);
      const dt = Math.max(time - lastTime, 1 / 120);
      lastTime = time;
      // Speed (legs per second), smoothed: the tunnel streaks stretch with it.
      core.speed += (Math.abs(s - core.s) / dt - core.speed) * Math.min(1, dt * 6);
      core.t = t;
      core.s = s;

      // Beats: depth from distance (see beatZ / beatLook in timeline.ts).
      for (const b of beats) {
        const r = s - b.anchor;
        const { opacity, blur } = beatLook(r);
        if (opacity < 0.004) {
          if (b.last !== 0) {
            b.last = 0;
            b.el.style.visibility = "hidden";
            b.el.style.opacity = "0";
          }
          continue;
        }
        b.last = opacity;
        b.el.style.visibility = "visible";
        b.el.style.opacity = opacity.toFixed(3);
        // perspective() inside the transform uses the element's transform-origin (the Core's
        // centre: the beat covers the whole visible screen) as the vanishing point.
        b.el.style.transform = `perspective(${core.focalPx.toFixed(0)}px) translate3d(0, 0, ${beatZ(r).toFixed(1)}px)`;
        b.el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";

        // Satellites float in the Core's empty corners. At 95% of its radius above/below the
        // centre, the circle is only ~0.6 r wide, so a pill whose INNER edge starts at 0.62 r
        // clears it (right-side pills grow rightwards, left-side ones leftwards). A pill too wide
        // for its corner is pulled in so it stays on screen. Gentle sway.
        const cr = core.coreRadiusPx;
        b.sats.forEach((sat, i) => {
          const inner = Math.min(cr * 0.62 + 4, core.width / 2 - 10 - sat.w);
          const x = sat.sx * inner + Math.sin(time * 0.5 + i * 2.1) * 3;
          const y = sat.sy * cr * 0.95 + Math.cos(time * 0.4 + i * 1.3) * 4;
          sat.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${sat.sx > 0 ? 0 : -100}%, -50%)`;
        });
      }

      // Fixed UI: progress, chapter counter, scroll hint (fades out at the end).
      if (bar) bar.style.transform = `scaleX(${(t / TOTAL).toFixed(4)})`;
      const chapter = CHAPTERS.findLastIndex((key) => t >= chapterStart(key).travelT[0] - 0.001);
      if (count && chapter !== lastChapter) {
        lastChapter = chapter;
        count.textContent = String(chapter + 1).padStart(2, "0");
      }
      if (hint) hint.style.opacity = (1 - ramp(t, TOTAL - 0.45, TOTAL - 0.15)).toFixed(3);

      // 3. Render the 3D for this frame, unless covered or scrolled away.
      const onStage = window.scrollY < trigger.end + window.innerHeight;
      if (core.render && onStage && !core.menuOpen && !uiStore.getState().overlayOpen) core.render(time);
    };
    gsap.ticker.add(tick);

    window.__core = {
      t: () => proxy.t,
      total: TOTAL,
      scrollFor: (t) => trigger.start + (t / TOTAL) * (trigger.end - trigger.start),
      circle: () => ({ x: core.projected.x, y: core.projected.y, r: core.coreRadiusPx }),
      holds: STOPS.map((stop) => ({ id: stop.id, t: (stop.t0 + stop.t1) / 2 })),
      gates: GATES.map((gate) => gate.t),
      morphHalf: MORPH_HALF,
    };

    // Fonts change text sizes: re-measure the track and the satellites once they're in.
    void document.fonts.ready.then(() => {
      size = "";
      ScrollTrigger.refresh();
    });

    const idle = "requestIdleCallback" in window ? window.requestIdleCallback(() => setMounted(true), { timeout: 1200 }) : 0;
    const timer = idle ? 0 : window.setTimeout(() => setMounted(true), 200);

    return () => {
      gsap.ticker.remove(tick);
      tween.scrollTrigger?.kill();
      tween.kill();
      delete window.__core;
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-10 hidden transition-opacity duration-1000 ease-out stage:block", ready ? "opacity-100" : "opacity-0")}
    >
      {mounted && <CoreCanvas screenshots={screenshots} onReady={() => setReady(true)} />}
    </div>
  );
}
