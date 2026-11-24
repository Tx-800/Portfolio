"use client";

import { useRef } from "react";
import { core } from "@/components/core/timeline";

/**
 * Invisible touch surface over the Core: drag sideways to turn it. `touch-action: pan-y` keeps
 * vertical swipes as native page scrolling (the browser then cancels the pointer), so only
 * sideways drags rotate. The 3D reads core.drag and springs back with inertia on release.
 */
export function CoreDrag() {
  const start = useRef<{ x: number; y: number } | null>(null);

  const release = () => {
    start.current = null;
    core.drag.active = false;
    core.drag.x = 0;
    core.drag.y = 0;
  };

  return (
    <div
      aria-hidden="true"
      className="absolute top-[50svh] left-1/2 z-20 hidden size-[calc(var(--core-r,28vw)*2.3)] -translate-1/2 touch-pan-y rounded-full stage:block"
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
        core.drag.active = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!start.current) return;
        // px → radians: a drag across the Core's radius turns it ~70°.
        const r = core.coreRadiusPx || 100;
        core.drag.x = ((e.clientX - start.current.x) / r) * 1.2;
        core.drag.y = ((e.clientY - start.current.y) / r) * 0.5;
      }}
      onPointerUp={release}
      onPointerCancel={release}
    />
  );
}
