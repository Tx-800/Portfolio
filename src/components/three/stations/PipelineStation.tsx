"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, CatmullRomCurve3, MathUtils, Color, EdgesGeometry, Object3D, Vector3, type Group, type InstancedMesh, type MeshStandardMaterial } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";

const INDEX = stationIndex("pipeline");
const CUBE = 4.2;
/** Four "tables" stacked inside the cube: raw at the bottom, curated at the top. */
const LAYERS = [-1.2, -0.4, 0.4, 1.2];
/** Seconds for one refresh sweep to travel from the bottom layer to the top. */
const SWEEP_PERIOD = 2.8;
const PULSES_PER_TUBE = 7;

/** Three sources (operational DBs, a MongoDB collection, ad-spend feeds) piping into the cube. */
// Tubes enter from the right, the top-back and the lower right (the packet arrives from the
// right too), leaving the left side clear for the HTML panel.
const SOURCES: [number, number, number][][] = [
  [[11, 4, -8], [6.5, 2.8, -2.5], [2.9, 0.8, 0]],
  [[2, 7, -10], [1.2, 4.6, -3.5], [0, 2.9, 0]],
  [[12, -3.5, -5], [6.5, -2.2, -0.5], [2.9, -0.7, 0.2]],
];

/**
 * 04 — The Pipeline & Warehouse. Glowing tubes carry pulses of data into a faceted glass cube;
 * inside, stacked table slabs refresh with a light sweep: Snowflake dynamic tables.
 */
export function PipelineStation() {
  const { palette, glow, tier } = useScene();
  const cube = useRef<Group>(null);
  const layers = useRef<(MeshStandardMaterial | null)[]>([]);
  const pulses = useRef<InstancedMesh>(null);
  const scrub = useRef({ value: 0 });

  const tubes = useMemo(() => SOURCES.map((pts) => new CatmullRomCurve3(pts.map((p) => new Vector3(...p)))), []);
  const edges = useMemo(() => {
    const box = new BoxGeometry(CUBE + 0.06, CUBE + 0.06, CUBE + 0.06);
    const geometry = new EdgesGeometry(box);
    box.dispose();
    return geometry;
  }, []);
  // Passed as a prop (not declared in JSX), so R3F won't dispose it for us.
  useEffect(() => () => edges.dispose(), [edges]);
  const scratch = useMemo(() => ({ dummy: new Object3D(), p: new Vector3(), c: new Color() }), []);
  const total = SOURCES.length * PULSES_PER_TUBE;

  const ref = useStationFrame(INDEX, (state, delta) => {
    const time = state.clock.elapsedTime;
    if (cube.current) cube.current.rotation.y += delta * 0.12;

    const sp = scrubbed(INDEX, scrub.current, delta);
    if (sp !== null) {
      // Mobile stage: the layers fill bottom → top with the scroll; the filling edge glows.
      const fill = sp * (LAYERS.length + 0.4);
      layers.current.forEach((material, i) => {
        if (!material) return;
        const filled = MathUtils.clamp(fill - i, 0, 1);
        const edge = Math.exp(-((fill - i - 0.5) ** 2) / 0.08);
        material.emissiveIntensity = 0.3 + filled * 1.3 * glow + edge * 1.2 * glow;
      });
    } else {
      // Desktop: a refresh sweep rising through the layers, then starting again.
      const sweepY = -1.9 + ((time % SWEEP_PERIOD) / SWEEP_PERIOD) * 3.8;
      layers.current.forEach((material, i) => {
        if (!material) return;
        const d = LAYERS[i] - sweepY;
        material.emissiveIntensity = 0.35 + Math.exp(-(d * d) / 0.09) * 2.6 * glow;
      });
    }
    // Pulse phase: scroll-driven on mobile (scrolling back runs them backwards), timed on desktop.
    const flow = sp !== null ? sp * 2.4 : time * 0.22;

    // Data pulses flowing along each tube, coloured gold → orange → pink by progress.
    const mesh = pulses.current;
    if (!mesh) return;
    const { dummy, p, c } = scratch;
    tubes.forEach((curve, tube) => {
      for (let k = 0; k < PULSES_PER_TUBE; k++) {
        const u = (flow + k / PULSES_PER_TUBE + tube * 0.13) % 1;
        curve.getPoint(u, p);
        dummy.position.copy(p);
        dummy.scale.setScalar(0.6 + Math.sin(u * Math.PI) * 0.6);
        dummy.updateMatrix();
        const i = tube * PULSES_PER_TUBE + k;
        mesh.setMatrixAt(i, dummy.matrix);
        if (u < 0.5) c.copy(palette.color.gold).lerp(palette.color.accent, u * 2);
        else c.copy(palette.color.accent).lerp(palette.color["accent-2"], (u - 0.5) * 2);
        mesh.setColorAt(i, c.multiplyScalar(glow * 1.6));
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <Station ref={ref} id="pipeline">
      {/* Tubes: dark glassy pipes with a faint inner glow. */}
      {tubes.map((curve, i) => (
        <mesh key={i}>
          <tubeGeometry args={[curve, 64, 0.11, 12, false]} />
          <meshStandardMaterial
            color={palette.color["surface-2"]}
            emissive={palette.color["accent-2"]}
            emissiveIntensity={0.35}
            metalness={0.4}
            roughness={0.25}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* Source nodes at the start of each tube. */}
      {SOURCES.map((pts, i) => (
        <group key={i} position={pts[0]}>
          <mesh>
            <octahedronGeometry args={[0.32, 0]} />
            <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} />
          </mesh>
          <Glow color={palette.color.gold} size={2} opacity={0.35} />
        </group>
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, total]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* The warehouse: a faceted glass cube with gold edges and table slabs inside. */}
      <group ref={cube}>
        <RoundedBox args={[CUBE, CUBE, CUBE]} radius={0.22} smoothness={4}>
          {tier === "high" ? (
            <meshPhysicalMaterial
              color={palette.color.heading}
              transmission={1}
              thickness={1.4}
              roughness={0.06}
              ior={1.38}
              attenuationColor={palette.color["accent-2"]}
              attenuationDistance={9}
              clearcoat={1}
              clearcoatRoughness={0.1}
              iridescence={0.35}
            />
          ) : (
            <meshStandardMaterial color={palette.color["accent-2"]} transparent opacity={0.1} roughness={0.15} depthWrite={false} />
          )}
        </RoundedBox>
        <lineSegments geometry={edges}>
          <lineBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 0.9)} toneMapped={false} transparent opacity={0.75} />
        </lineSegments>
        {LAYERS.map((y, i) => (
          <RoundedBox key={y} args={[2.9, 0.07, 2.3]} radius={0.03} smoothness={2} position={[0, y, 0]}>
            <meshStandardMaterial
              ref={(m) => {
                layers.current[i] = m;
              }}
              color={palette.color.surface}
              emissive={palette.color.accent}
              emissiveIntensity={0.35}
              metalness={0.2}
              roughness={0.4}
              toneMapped={false}
            />
          </RoundedBox>
        ))}
      </group>
      <Glow color={palette.color.accent} size={12} opacity={0.14} />
    </Station>
  );
}
