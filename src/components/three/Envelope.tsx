"use client";

import { RoundedBox } from "@react-three/drei";
import type { Ref } from "react";
import type { Group } from "three";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";

interface EnvelopeProps {
  ref?: Ref<Group>;
  /** Width in world units; height follows at 0.66. */
  size?: number;
}

/**
 * Small glowing envelope: the "email" in the stations (stale alert, compliance request).
 * Light card body with a glowing V-flap, so it reads as mail even when tiny.
 */
export function Envelope({ ref, size = 0.7 }: EnvelopeProps) {
  const { palette, glow } = useScene();
  const w = size;
  const h = size * 0.66;
  // Flap edges run from the top corners to just below the centre.
  const flapLength = Math.hypot(w / 2, h * 0.55);
  const flapAngle = Math.atan2(h * 0.55, w / 2);

  return (
    <group ref={ref}>
      <RoundedBox args={[w, h, w * 0.05]} radius={w * 0.04} smoothness={2}>
        <meshStandardMaterial color={palette.color.heading} roughness={0.5} metalness={0.1} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[(side * w) / 4, h / 2 - (h * 0.55) / 2, w * 0.03]}
          rotation={[0, 0, side * flapAngle]}
        >
          <boxGeometry args={[flapLength, w * 0.035, 0.005]} />
          <meshBasicMaterial color={palette.color.accent.clone().multiplyScalar(glow * 1.3)} toneMapped={false} />
        </mesh>
      ))}
      <Glow color={palette.color.accent} size={size * 3} opacity={0.4} />
    </group>
  );
}
