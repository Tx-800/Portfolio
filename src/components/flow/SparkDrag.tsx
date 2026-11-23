"use client";

import { useRef, type PointerEvent } from "react";
import { flowText } from "@/data/content";
import { flowInput } from "@/store/flow";

/**
 * Touch layer over the Spark's 3D slot: drag sideways to pull the packet; let go and it springs
 * back (the spring lives in FlowPacket). touch-action: pan-y keeps vertical page scrolling
 * native; only horizontal-ish drags reach us. A vertical swipe that turns into a page scroll
 * fires pointercancel → the packet is released.
 */
export function SparkDrag() {
  const start = useRef<{ x: number; y: number } | null>(null);

  function down(e: PointerEvent<HTMLDivElement>) {
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const w = e.currentTarget.offsetWidth;
    // Rubber-band: the further you pull, the less it follows.
    const pull = (d: number, max: number) => max * Math.tanh(d / max);
    flowInput.spark.x = pull(e.clientX - start.current.x, w * 0.32);
    flowInput.spark.y = pull(e.clientY - start.current.y, w * 0.2);
  }
  function release() {
    start.current = null;
    flowInput.spark.x = 0;
    flowInput.spark.y = 0;
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span className="label-mono pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-muted">{flowText.sparkHint}</span>
    </div>
  );
}
