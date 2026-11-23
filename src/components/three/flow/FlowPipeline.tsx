"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, CatmullRomCurve3, Color, EdgesGeometry, Object3D, Vector3, type Group, type InstancedMesh, type MeshStandardMaterial } from "three";
import { Anchored } from "@/components/three/flow/Anchored";
import { flow } from "@/components/three/flow/sync";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";
import { flowInput } from "@/store/flow";

const CUBE = 3.8;
const LAYERS = [-1.1, -0.37, 0.37, 1.1];
const PULSES_PER_TUBE = 6;
/** How long a "Refresh" burst lasts (s). */
const BURST = 2.4;
/** Tubes come in from the right, top and lower right; the packet sits inside the cube. */
const SOURCES: [number, number, number][][] = [
  [[5.6, 3.6, -3], [3.6, 2.2, -1], [1.9, 0.7, 0]],
  [[0.6, 5.4, -3], [0.4, 3.6, -1.2], [0, 1.9, 0]],
  [[5.8, -3.2, -2], [3.6, -1.9, -0.4], [1.9, -0.6, 0.2]],
];

/**
 * 04 — The Pipeline & Warehouse (flow). Tubes feed a crystal cube; inside, four table layers.
 * Idle: slow pulses, layers softly lit. "Refresh" (RefreshButton) sends a fast burst of pulses
 * through the tubes and a light sweep up through the layers, like a dynamic-table refresh.
 */
export function FlowPipeline() {
  const { palette, glow, tier } = useScene();
  const cube = useRef<Group>(null);
  const layers = useRef<(MeshStandardMaterial | null)[]>([]);
  const pulses = useRef<InstancedMesh>(null);
  const state = useRef({ phase: 0, dummy: new Object3D(), p: new Vector3(), c: new Color() });

  const tubes = useMemo(() => SOURCES.map((pts) => new CatmullRomCurve3(pts.map((p) => new Vector3(...p)))), []);
  const edges = useMemo(() => {
    const box = new BoxGeometry(CUBE + 0.05, CUBE + 0.05, CUBE + 0.05);
    const geometry = new EdgesGeometry(box);
    box.dispose();
    return geometry;
  }, []);
  useEffect(() => () => edges.dispose(), [edges]);
  const total = SOURCES.length * PULSES_PER_TUBE;

  return (
    <Anchored
      id="pipeline"
      onFrame={(_, delta) => {
        const s = state.current;
        const now = performance.now() / 1000;
        const since = now - flowInput.pipeline.refreshAt;
        // burst: 1 right after a tap, easing back to 0 over BURST seconds.
        const burst = since >= 0 && since < BURST ? 1 - since / BURST : 0;

        if (cube.current && !flow.reduced) cube.current.rotation.y += delta * 0.1;

        // Layers: idle glow; during a burst a sweep rises bottom → top (static highlight with reduced motion).
        const sweepY = -1.8 + (1 - burst) * 3.6;
        layers.current.forEach((material, i) => {
          if (!material) return;
          const d = LAYERS[i] - sweepY;
          const sweep = burst > 0 ? Math.exp(-(d * d) / 0.12) * (flow.reduced ? 1 : burst + 0.4) : 0;
          material.emissiveIntensity = 0.45 + sweep * 2.4 * glow;
        });

        // Pulses: slow drift, much faster during a burst.
        if (!flow.reduced) s.phase += delta * (0.12 + burst * 1.4);
        const mesh = pulses.current;
        if (!mesh) return;
        tubes.forEach((curve, tube) => {
          for (let k = 0; k < PULSES_PER_TUBE; k++) {
            const u = (s.phase + k / PULSES_PER_TUBE + tube * 0.17) % 1;
            curve.getPoint(u, s.p);
            s.dummy.position.copy(s.p);
            s.dummy.scale.setScalar((0.6 + Math.sin(u * Math.PI) * 0.6) * (1 + burst * 0.5));
            s.dummy.updateMatrix();
            const i = tube * PULSES_PER_TUBE + k;
            mesh.setMatrixAt(i, s.dummy.matrix);
            if (u < 0.5) s.c.copy(palette.color.gold).lerp(palette.color.accent, u * 2);
            else s.c.copy(palette.color.accent).lerp(palette.color["accent-2"], (u - 0.5) * 2);
            mesh.setColorAt(i, s.c.multiplyScalar(glow * (1.4 + burst)));
          }
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }}
    >
      {tubes.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 48, 0.12, 10, false]} />
          <meshStandardMaterial color={palette.color["surface-2"]} emissive={palette.color["accent-2"]} emissiveIntensity={0.4} roughness={0.3} transparent opacity={0.9} />
        </mesh>
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, total]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <group ref={cube}>
        <RoundedBox args={[CUBE, CUBE, CUBE]} radius={0.2} smoothness={4}>
          <meshStandardMaterial color={palette.color["accent-2"]} transparent opacity={tier === "high" ? 0.14 : 0.1} roughness={0.15} depthWrite={false} />
        </RoundedBox>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 0.9)} toneMapped={false} transparent opacity={0.8} />
        </lineSegments>
        {LAYERS.map((y, i) => (
          <RoundedBox key={y} args={[2.7, 0.07, 2.1]} radius={0.03} smoothness={2} position={[0, y, 0]}>
            <meshStandardMaterial
              ref={(m) => {
                layers.current[i] = m;
              }}
              color={palette.color.surface}
              emissive={palette.color.accent}
              emissiveIntensity={0.45}
              toneMapped={false}
            />
          </RoundedBox>
        ))}
      </group>
      <Glow color={palette.color.accent} size={10} opacity={0.12} />
    </Anchored>
  );
}
