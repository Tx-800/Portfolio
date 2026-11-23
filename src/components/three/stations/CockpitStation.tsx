"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { Color, MathUtils, type MeshBasicMaterial } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";
import { createDashboardTexture } from "@/components/three/textures";

const INDEX = stationIndex("cockpit");

/** One screen per "client business": a 3×2 main grid plus one screen on each angled wing. */
const SCREENS: { position: [number, number, number]; rotationY: number; size: [number, number] }[] = [
  ...[0, 1].flatMap((row) =>
    [-1, 0, 1].map((col) => ({
      position: [col * 1.75, 1.35 - row * 1.12, 0.1] as [number, number, number],
      rotationY: 0,
      size: [1.55, 0.95] as [number, number],
    })),
  ),
  { position: [-3.55, 0.8, 0.75], rotationY: 0.55, size: [1.4, 1.9] },
  { position: [3.55, 0.8, 0.75], rotationY: -0.55, size: [1.4, 1.9] },
];

/** How many screens light up per second once the packet arrives. */
const LIGHT_RATE = 3.5;
const OFF = 0.08;

/**
 * 03 — The Cockpit. A sleek control desk with a wall of small screens, one per client business.
 * When the camera parks here, the screens light up one by one, as if LocalPilot just synced them.
 */
export function CockpitStation() {
  const { palette, glow, tier } = useScene();
  const materials = useRef<(MeshBasicMaterial | null)[]>([]);
  const state = useRef({ lit: 0, levels: SCREENS.map(() => OFF) });
  const scrub = useRef({ value: 0 });

  // A few dashboard variations, shared between screens.
  const textures = useMemo(() => [1, 2, 3].map((seed) => createDashboardTexture(seed)), []);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  // Each screen glows in one colour of the signature gradient.
  const tints = useMemo(() => {
    const swatches = [palette.color.gold, palette.color.accent, palette.color["accent-2"]];
    return SCREENS.map((_, i) => swatches[i % swatches.length].clone());
  }, [palette]);

  const ref = useStationFrame(INDEX, (_, delta, weight) => {
    const s = state.current;
    const p = scrubbed(INDEX, scrub.current, delta);
    if (p !== null) {
      // Mobile stage: one more client screen lights up with every step of the scroll.
      s.lit = p * 1.15 * SCREENS.length;
    } else {
      // Desktop: parked here → count screens up; leaving → switch them off quickly.
      s.lit = weight > 0.6 ? Math.min(SCREENS.length, s.lit + delta * LIGHT_RATE) : Math.max(0, s.lit - delta * LIGHT_RATE * 2);
    }
    materials.current.forEach((material, i) => {
      if (!material) return;
      const target = s.lit > i ? 1 : OFF;
      s.levels[i] = MathUtils.damp(s.levels[i], target, 6, delta);
      material.color.copy(tints[i]).multiplyScalar(s.levels[i] * glow);
    });
  });

  return (
    <Station ref={ref} id="cockpit">
      <group position={[0, -0.4, 0]} scale={0.82}>
        {/* Back wall holding the screens, leaning back slightly. */}
        <group rotation={[-0.12, 0, 0]}>
          <RoundedBox args={[5.6, 2.6, 0.16]} radius={0.1} smoothness={4} position={[0, 0.8, -0.02]}>
            <meshStandardMaterial color={palette.color.surface} metalness={tier === "high" ? 0.75 : 0.3} roughness={0.3} />
          </RoundedBox>
          {SCREENS.map((screen, i) => (
            <group key={i} position={screen.position} rotation={[0, screen.rotationY, 0]}>
              {screen.rotationY !== 0 && (
                <RoundedBox args={[screen.size[0] + 0.18, screen.size[1] + 0.18, 0.12]} radius={0.08} smoothness={4} position={[0, 0, -0.08]}>
                  <meshStandardMaterial color={palette.color.surface} metalness={0.6} roughness={0.35} />
                </RoundedBox>
              )}
              <mesh>
                <planeGeometry args={screen.size} />
                <meshBasicMaterial
                  ref={(m) => {
                    materials.current[i] = m;
                  }}
                  map={textures[i % textures.length]}
                  color={new Color().copy(tints[i]).multiplyScalar(OFF)}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Desk: a slab angled towards the viewer, with a glowing gradient edge. */}
        <RoundedBox args={[7.6, 0.28, 2.2]} radius={0.12} smoothness={4} position={[0, -1.1, 1.2]} rotation={[0.28, 0, 0]}>
          <meshStandardMaterial color={palette.color["surface-2"]} metalness={tier === "high" ? 0.55 : 0.3} roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, -0.97, 2.32]} rotation={[0.28, 0, 0]}>
          <boxGeometry args={[7.2, 0.025, 0.025]} />
          <meshBasicMaterial color={palette.color.accent.clone().multiplyScalar(glow * 1.3)} toneMapped={false} />
        </mesh>

        <Glow color={palette.color.accent} size={11} opacity={0.12} position={[0, 0.8, -0.6]} />
      </group>
    </Station>
  );
}
