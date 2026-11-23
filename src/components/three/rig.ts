import { useFrame, type RootState } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, type Group } from "three";
import { STATION_COUNT } from "@/components/three/path";
import { sceneProgress } from "@/store/journey";

/**
 * Shared, per-frame camera state. CameraRig writes it first each frame (useFrame priority −1);
 * the packet and stations read it afterwards. A plain mutable object, not React state, so
 * nothing re-renders while the camera moves.
 */
export const rig = {
  /** Smoothed path position (0 → 1): the scroll value with inertia applied. */
  t: 0,
};

/** Distance from the camera to station `index`, in stations (0 = parked there). */
export function stationDistance(index: number): number {
  return Math.abs(rig.t * (STATION_COUNT - 1) - index);
}

/** 1 when parked at the station, falling to 0 one station away. */
export function stationWeight(index: number): number {
  return 1 - Math.min(stationDistance(index), 1);
}

/**
 * Mobile stage mode: the station's scrubbed scene progress (0 → 1), smoothed so native touch
 * scrolling feels fluid; scrolling back plays the animation backwards. Desktop: null, and
 * stations run their own timers instead. Call once per frame per station with its own `memo`.
 */
export function scrubbed(index: number, memo: { value: number }, delta: number): number | null {
  const p = sceneProgress(index);
  if (p === null) return null;
  memo.value = MathUtils.damp(memo.value, p, 10, delta);
  return memo.value;
}

type StationFrame = (state: RootState, delta: number, weight: number) => void;

/**
 * Per-station frame loop. The station's group is hidden (not drawn) and its animation skipped
 * unless the camera is within 1 station of it, so at most 2 stations ever cost anything.
 */
export function useStationFrame(index: number, onFrame?: StationFrame) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    // < 0.95: neighbours are hidden while parked here (including the one we just passed, which
    // sits BEHIND the camera where fog can't hide it) and appear just after travel starts
    // (the camera-following fog keeps that moment invisible).
    const near = stationDistance(index) < 0.95;
    if (ref.current) ref.current.visible = near;
    // Clamp delta so a long pause (tab switch) doesn't make animations jump.
    if (near) onFrame?.(state, Math.min(delta, 0.1), stationWeight(index));
  });
  return ref;
}
