"use client";

import { useFrame, type RootState } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { MathUtils, Vector3, type Group } from "three";
import { anchorNearView, anchorSettle, docToWorld, flow, type AnchorBox } from "@/components/three/flow/sync";

export interface AnchorFrame {
  /** 0 → 1 as the anchor arrives at the viewport centre (1 = settled), back to 0 as it leaves. */
  settle: number;
  box: AnchorBox;
  /** CSS px per station unit (the anchor's width / `units`). */
  scale: number;
}

interface AnchoredProps {
  /** Matches data-anchor="…" on the slot in the HTML. */
  id: string;
  /** The station is modelled `units` wide; it's scaled to fill the slot's width. */
  units?: number;
  onFrame?: (state: RootState, delta: number, info: AnchorFrame) => void;
  children: ReactNode;
}

/** Debug data for `npm run shots` (only written under automation: navigator.webdriver). */
type FlowDebug = { stations: Record<string, { x: number; y: number }>; packet?: { x: number; y: number; r: number } };
declare global {
  interface Window {
    __flowDebug?: FlowDebug;
  }
}
export const debugEnabled = typeof navigator !== "undefined" && navigator.webdriver === true;

/**
 * Pins a station to its DOM slot. Every frame:
 *   1. look up the slot's cached document box,
 *   2. hide (and skip) the station if the slot is off-canvas → only nearby stations cost anything,
 *   3. place the group at the slot's centre for this frame's scrollY (docToWorld),
 *   4. scale it so `units` station units span the slot's width,
 *   5. let it "arrive": slightly small and lower while the slot is still entering the viewport.
 */
export function Anchored({ id, units = 10, onFrame, children }: AnchoredProps) {
  const group = useRef<Group>(null);
  const scratch = useRef({ v: new Vector3(), p: new Vector3() });

  useFrame((state, rawDelta) => {
    const g = group.current;
    const box = flow.anchors.get(id);
    if (!g || !box) return;
    const near = anchorNearView(box, 120);
    g.visible = near;
    if (!near) return;

    const settle = flow.reduced ? 1 : MathUtils.smoothstep(anchorSettle(box), 0, 0.55);
    const scale = box.w / units;
    const { v } = scratch.current;
    docToWorld(box.x + box.w / 2, box.y + box.h / 2, v);
    // Arrival: rises the last 6% of the slot height and grows from 86% as it settles.
    g.position.set(v.x, v.y - (1 - settle) * box.h * 0.06, 0);
    g.scale.setScalar(scale * (0.86 + 0.14 * settle));
    onFrame?.(state, Math.min(rawDelta, 0.1), { settle, box, scale });

    if (debugEnabled) {
      // Where the station's centre lands on screen (viewport px), for the drift check.
      const p = scratch.current.p.set(v.x, v.y, 0).project(state.camera);
      const debug = (window.__flowDebug ??= { stations: {} });
      debug.stations[id] = {
        x: ((p.x + 1) / 2) * state.size.width,
        y: ((1 - p.y) / 2) * state.size.height - flow.pad,
      };
    }
  });

  return <group ref={group}>{children}</group>;
}
