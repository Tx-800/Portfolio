"use client";

import { useMemo, type Ref } from "react";
import { AdditiveBlending, type Color, type Sprite } from "three";
import { useScene } from "@/components/three/SceneContext";
import { getGlowTexture } from "@/components/three/textures";

interface GlowProps {
  ref?: Ref<Sprite>;
  color: Color;
  size: number;
  opacity?: number;
  position?: [number, number, number];
}

/**
 * Soft additive halo sprite. Gives accents a glow on every tier, including phones where bloom
 * is off; on desktop, bloom adds to it.
 */
export function Glow({ ref, color, size, opacity = 0.5, position }: GlowProps) {
  const map = useMemo(() => getGlowTexture(), []);
  const { tier } = useScene();
  // Lowest tier: skip big ambient halos (each one is a full-screen additive pass on a phone GPU).
  if (tier === "min" && size > 4) return null;
  return (
    <sprite ref={ref} position={position} scale={[size, size, 1]}>
      <spriteMaterial
        map={map}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}
