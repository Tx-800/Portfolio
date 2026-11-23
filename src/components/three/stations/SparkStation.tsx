"use client";

import { Line } from "@react-three/drei";
import { useMemo, useRef, type ComponentRef } from "react";
import { MathUtils, Vector3, type Mesh, type MeshBasicMaterial } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";
import { useJourney } from "@/store/journey";

const INDEX = stationIndex("spark");
const PULSE_PERIOD = 3.2;
type LineRef = ComponentRef<typeof Line>;
const RINGS = [
  { radius: 1.05, rotation: [1.15, 0.3, 0] as [number, number, number] },
  { radius: 1.45, rotation: [1.35, -0.5, 0.4] as [number, number, number] },
];

function circle(radius: number): Vector3[] {
  return Array.from({ length: 97 }, (_, i) => {
    const a = (i / 96) * Math.PI * 2;
    return new Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  });
}

/**
 * 01 — The Spark. The packet itself is the hero; this station frames it: two slow orbit rings
 * and a soft shockwave that ripples out every few seconds, like a signal being sent.
 * Mobile stage: the rings DRAW themselves as you scroll (dash-offset reveal) while the packet
 * scales in (Packet.tsx), and undraw when you scroll back.
 */
export function SparkStation() {
  const { palette, glow } = useScene();
  const stageMode = useJourney((s) => s.stageMode);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const wave = useRef<Mesh>(null);
  const lines = useRef<(LineRef | null)[]>([]);
  const scrub = useRef({ value: 0 });
  const points = useMemo(() => RINGS.map((r) => circle(r.radius)), []);

  const ref = useStationFrame(INDEX, (state, delta) => {
    const time = state.clock.elapsedTime;
    const p = scrubbed(INDEX, scrub.current, delta);

    if (ringA.current) ringA.current.rotation.z += delta * 0.25;
    if (ringB.current) ringB.current.rotation.z -= delta * 0.18;

    // Drawn rings: one dash as long as the circumference; the offset reveals p of it.
    lines.current.forEach((line, i) => {
      if (!line || p === null) return;
      const circumference = Math.PI * 2 * RINGS[i].radius;
      const reveal = MathUtils.clamp(p * 1.4 - i * 0.25, 0, 1); // inner ring first, then outer
      line.material.dashOffset = circumference * (1 - reveal);
      line.rotation.z += delta * (i ? -0.12 : 0.18);
    });

    if (wave.current) {
      const k = (time % PULSE_PERIOD) / PULSE_PERIOD; // 0 → 1
      wave.current.scale.setScalar(0.45 + k * 1.5);
      // On mobile the shockwave only starts once the rings are drawn.
      const gate = p === null ? 1 : MathUtils.smoothstep(p, 0.6, 0.9);
      (wave.current.material as MeshBasicMaterial).opacity = (1 - k) ** 2 * 0.35 * gate;
    }
  });

  return (
    <Station ref={ref} id="spark">
      {stageMode
        ? RINGS.map((ring, i) => (
            <group key={ring.radius} rotation={ring.rotation}>
              <Line
                ref={(l) => {
                  lines.current[i] = l;
                }}
                points={points[i]}
                color={(i ? palette.color["accent-2"] : palette.color.gold).clone().multiplyScalar(glow)}
                lineWidth={i ? 1.6 : 2.2}
                dashed
                dashSize={Math.PI * 2 * ring.radius}
                gapSize={Math.PI * 2 * ring.radius}
                dashOffset={Math.PI * 2 * ring.radius}
                toneMapped={false}
              />
            </group>
          ))
        : (
          <>
            <mesh ref={ringA} rotation={RINGS[0].rotation}>
              <torusGeometry args={[RINGS[0].radius, 0.01, 8, 160]} />
              <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} />
            </mesh>
            <mesh ref={ringB} rotation={RINGS[1].rotation}>
              <torusGeometry args={[RINGS[1].radius, 0.007, 8, 200]} />
              <meshBasicMaterial color={palette.color["accent-2"].clone().multiplyScalar(glow * 0.8)} toneMapped={false} transparent opacity={0.7} />
            </mesh>
          </>
        )}
      {/* Shockwave: a flat ring facing the camera, expanding and fading. */}
      <mesh ref={wave}>
        <ringGeometry args={[0.98, 1, 96]} />
        <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} transparent depthWrite={false} />
      </mesh>
      <Glow color={palette.color["accent-2"]} size={6} opacity={0.12} />
    </Station>
  );
}
