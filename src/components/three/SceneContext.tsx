"use client";

import { createContext, useContext } from "react";
import type { Palette } from "@/components/three/palette";

/**
 * high: desktop (dpr ≤ 2, bloom, environment reflections, transmission glass, trail).
 * low:  phones / low-power devices, or after a frame-rate drop (dpr ≤ 1.5, ≤ 1.25 on phones,
 *       no postprocessing, simpler materials, fewer particles). Glow sprites keep it warm.
 * min:  automatic last resort if a "low" device still can't keep up: dpr 1, very few particles,
 *       and no large glow sprites (full-screen additive overdraw is what costs most on phones).
 */
export type Tier = "high" | "low" | "min";

export interface SceneSettings {
  tier: Tier;
  palette: Palette;
  /** Brightness multiplier for emissive accents. >1 on high so bloom picks them up. */
  glow: number;
  /** Website hero screenshots that exist in /public, by project slug (resolved on the server). */
  screenshots: Record<string, string>;
}

const SceneContext = createContext<SceneSettings | null>(null);

export const SceneProvider = SceneContext.Provider;

export function useScene(): SceneSettings {
  const value = useContext(SceneContext);
  if (!value) throw new Error("useScene must be used inside <SceneProvider>");
  return value;
}
