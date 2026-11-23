"use client";

import { useEffect, useMemo, useRef } from "react";
import { Vector3 } from "three";
import { getCurves } from "@/components/three/path";
import { chapters } from "@/data/content";
import { journeyStore } from "@/store/journey";

const SIZE = 200;
const PAD = 16;

/**
 * Phase 2 test harness (open /?debug): a top-down map of the camera path with a placeholder
 * "packet" dot driven by the journey store. The dot should stop on each station while you
 * read a chapter (HOLD) and glide between stations in the gaps (TRAVEL).
 */
export function JourneyDebug() {
  const curve = useMemo(() => getCurves().packet, []);

  // Project world x/z onto the SVG (top-down view); z decreases as the journey goes deeper.
  const project = useMemo(() => {
    const points = curve.getPoints(200);
    const xs = points.map((p) => p.x);
    const zs = points.map((p) => p.z);
    const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const scale = (SIZE - PAD * 2) / Math.max(maxX - minX, maxZ - minZ);
    return (p: Vector3) => ({
      x: PAD + (p.x - minX) * scale + ((SIZE - PAD * 2) - (maxX - minX) * scale) / 2,
      y: PAD + (maxZ - p.z) * scale,
    });
  }, [curve]);

  const pathD = useMemo(
    () =>
      curve
        .getPoints(200)
        .map((p, i) => {
          const { x, y } = project(p);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    [curve, project],
  );

  const packetRef = useRef<SVGCircleElement>(null);
  const readoutRef = useRef<HTMLPreElement>(null);

  // Per-frame updates go straight to the DOM via a store subscription (no React re-render).
  useEffect(() => {
    const point = new Vector3();
    const apply = () => {
      const { progress, pathT, activeIndex, holding } = journeyStore.getState();
      curve.getPoint(pathT, point);
      const { x, y } = project(point);
      packetRef.current?.setAttribute("cx", x.toFixed(1));
      packetRef.current?.setAttribute("cy", y.toFixed(1));
      if (readoutRef.current) {
        readoutRef.current.textContent = [
          `scroll  ${(progress * 100).toFixed(1)}%`,
          `path t  ${pathT.toFixed(3)}`,
          `chapter ${chapters[activeIndex]?.number} ${chapters[activeIndex]?.name}`,
          `state   ${holding ? "HOLD" : "TRAVEL"}`,
        ].join("\n");
      }
    };
    apply();
    return journeyStore.subscribe(apply);
  }, [curve, project]);

  return (
    <aside
      aria-hidden="true"
      className="pointer-events-none fixed bottom-20 left-3 z-40 rounded-2xl border border-border-strong bg-bg/85 p-3 backdrop-blur-md xl:bottom-6 xl:left-6"
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <path d={pathD} fill="none" className="stroke-border-strong" strokeWidth={1.5} />
        {chapters.map((chapter, i) => {
          const { x, y } = project(curve.getPoint(i / (chapters.length - 1)));
          return (
            <g key={chapter.id}>
              <circle cx={x} cy={y} r={3} className="fill-muted" />
              <text x={x + 6} y={y + 3} className="fill-muted font-mono text-[9px]">
                {chapter.number}
              </text>
            </g>
          );
        })}
        <circle ref={packetRef} r={6} className="fill-accent" />
      </svg>
      <pre ref={readoutRef} className="mt-2 font-mono text-[0.6875rem] leading-snug text-heading" />
    </aside>
  );
}
