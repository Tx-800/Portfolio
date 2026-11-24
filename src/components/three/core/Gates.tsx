"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial, type Sprite, type SpriteMaterial } from "three";
import { core, GATES, ramp, WORLD_PER_LEG } from "@/components/core/timeline";
import { accentOf } from "@/components/three/core/accents";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";

/** Small enough to frame the Core from the beat before (≈1.5× its size), then grow past the screen. */
const RADIUS = 1.45;

/**
 * Rings of light standing in space at the start of each chapter (GATES in timeline.ts). From
 * far away a gate frames the Core; scrolling flies the camera through it, and the Core morphs
 * as you pass. Each gate fades in far ahead, brightens as it nears, and is gone once behind.
 */
export function Gates() {
  const { palette, glow } = useScene();
  const groups = useRef<(Group | null)[]>([]);
  const rings = useRef<(Mesh | null)[]>([]);
  const outer = useRef<(Mesh | null)[]>([]);
  const halos = useRef<(Sprite | null)[]>([]);

  useFrame((state) => {
    const cam = core.s * WORLD_PER_LEG;
    GATES.forEach((gate, i) => {
      const g = groups.current[i];
      if (!g) return;
      const ahead = gate.s * WORLD_PER_LEG - cam;
      g.visible = ahead > -1 && ahead < 20;
      if (!g.visible) return;
      g.position.z = -gate.s * WORLD_PER_LEG;
      g.rotation.z = state.clock.elapsedTime * 0.15 + i;
      // Appears only during the last beat before it (no gate hanging over a whole chapter).
      const fade = ramp(ahead, 20, 13) * ramp(ahead, -1, 1.2);
      // Faint while it frames the Core behind the hold text; flares up only as the camera flies in.
      const near = 0.28 + (1 - ramp(ahead, 2, 9)) * 1.2;
      const ring = rings.current[i];
      if (ring) (ring.material as MeshBasicMaterial).opacity = fade * near;
      const thin = outer.current[i];
      if (thin) (thin.material as MeshBasicMaterial).opacity = fade * near * 0.4;
      const halo = halos.current[i];
      // The halo is a big additive sprite: keep it off once it's close (it would wash the screen).
      if (halo) (halo.material as SpriteMaterial).opacity = fade * 0.16 * ramp(ahead, 4, 12);
    });
  });

  return (
    <>
      {GATES.map((gate, i) => {
        const color = accentOf(palette, gate.chapter).clone().multiplyScalar(glow * 1.3);
        return (
          <group
            key={gate.chapter}
            ref={(el) => {
              groups.current[i] = el;
            }}
          >
            <mesh
              ref={(el) => {
                rings.current[i] = el;
              }}
            >
              <torusGeometry args={[RADIUS, 0.03, 8, 160]} />
              <meshBasicMaterial color={color} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            <mesh
              ref={(el) => {
                outer.current[i] = el;
              }}
            >
              <torusGeometry args={[RADIUS * 1.08, 0.008, 6, 160]} />
              <meshBasicMaterial color={color} transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
            </mesh>
            <Glow
              ref={(el) => {
                halos.current[i] = el;
              }}
              color={color}
              size={RADIUS * 3.2}
              opacity={0}
            />
          </group>
        );
      })}
    </>
  );
}
