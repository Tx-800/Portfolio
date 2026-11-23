"use client";

import { RoundedBox } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, MathUtils, Object3D, type Group, type InstancedMesh, type LineBasicMaterial, type Mesh, type MeshStandardMaterial, type Sprite } from "three";
import { Envelope } from "@/components/three/Envelope";
import { Glow } from "@/components/three/Glow";
import { Label } from "@/components/three/Label";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { buildAgentGraph, CLUSTER_CENTERS, type ClusterId } from "@/components/three/stations/agentsGraph";
import { Station } from "@/components/three/stations/Station";
import { getProject, sceneLabels } from "@/data/content";

const INDEX = stationIndex("agents");

/** "People" the Onboarding Agent notifies (reminder pings fly to them). */
const PEOPLE: [number, number, number][] = [
  [-4.4, 1.6, 0.4],
  [-4.6, -0.2, 0.8],
  [-3.8, -1.9, 0.2],
  [-3.1, 2.4, -0.4],
];
const PING_PERIOD = 2.4;

/** Compliance: a small table that receives a new field. */
const TABLE_POS: [number, number, number] = [4.3, -0.6, 0.6];
const ROWS = 4;
const COMPLIANCE_CYCLE = 6;

/**
 * 06 — The Agents. An "AI brain": two clusters of thinking nodes, one per agent, joined by a bridge.
 *  - Onboarding (left): reminder pings fly out to "people" nodes.
 *  - Compliance (right): an envelope flies in and a new field row slides into a table.
 * Hover (desktop) or tap (touch) a cluster to highlight it and its connections.
 */
export function AgentsStation() {
  const { palette, glow } = useScene();
  const graph = useMemo(() => buildAgentGraph(), []);
  const nodes = useRef<InstancedMesh>(null);
  const lines = useRef<Record<ClusterId | "bridge", LineBasicMaterial | null>>({ onboarding: null, compliance: null, bridge: null });
  const pings = useRef<(Mesh | null)[]>([]);
  const people = useRef<(MeshStandardMaterial | null)[]>([]);
  const envelope = useRef<Group>(null);
  const newRow = useRef<Group>(null);
  const newRowLabel = useRef<Sprite>(null);
  // Highlight state lives in a ref: pointer events update it, the frame loop eases towards it.
  const focus = useRef<{ target: ClusterId | null; manual: ClusterId | null; level: Record<ClusterId, number> }>({
    target: null,
    manual: null,
    level: { onboarding: 0, compliance: 0 },
  });
  const scratch = useRef({ dummy: new Object3D(), color: new Color() });
  const scrub = useRef({ value: 0 });
  const count = graph.cluster.length;

  const base = useMemo<Record<ClusterId | "bridge", Color>>(
    () => ({ onboarding: palette.color.gold, compliance: palette.color["accent-2"], bridge: palette.color.accent }),
    [palette],
  );

  // Place the nodes once; only their colours change per frame.
  useLayoutEffect(() => {
    const mesh = nodes.current;
    if (!mesh) return;
    const { dummy } = scratch.current;
    for (let i = 0; i < count; i++) {
      dummy.position.fromArray(graph.positions, i * 3);
      dummy.scale.setScalar(graph.size[i] / 0.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, base[graph.cluster[i] ?? "bridge"]);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [graph, count, base]);

  const ref = useStationFrame(INDEX, (state, delta, weight) => {
    const time = state.clock.elapsedTime;
    const f = focus.current;
    const sp = scrubbed(INDEX, scrub.current, delta);
    if (sp !== null) {
      // Mobile stage: the clusters light up in turn with the scroll; a tap pins one.
      if (weight < 0.5) f.manual = null;
      f.target = f.manual ?? (sp < 0.5 ? "onboarding" : "compliance");
    }
    (["onboarding", "compliance"] as ClusterId[]).forEach((id) => {
      f.level[id] = MathUtils.damp(f.level[id], f.target === id ? 1 : 0, 5, delta);
    });
    const anyFocus = Math.max(f.level.onboarding, f.level.compliance);

    // Nodes "think": each pulses on its own phase. Focused cluster brightens, others dim.
    const mesh = nodes.current;
    if (mesh) {
      const { color } = scratch.current;
      for (let i = 0; i < count; i++) {
        const id = graph.cluster[i];
        const lit = id ? f.level[id] : 0;
        const dim = 1 - (anyFocus - lit) * 0.6;
        const pulse = 0.55 + 0.45 * Math.sin(time * 2.2 + graph.phase[i]);
        color.copy(base[id ?? "bridge"]).multiplyScalar((0.5 + pulse * 0.9 + lit * 1.2) * glow * 0.75 * dim);
        mesh.setColorAt(i, color);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    (Object.keys(lines.current) as (ClusterId | "bridge")[]).forEach((id) => {
      const material = lines.current[id];
      if (!material) return;
      const lit = id === "bridge" ? 0 : f.level[id];
      material.opacity = (0.28 + lit * 0.55) * (1 - (anyFocus - lit) * 0.5);
    });

    // Onboarding: reminder pings travel from the cluster to each person, staggered.
    const [cx, cy, cz] = CLUSTER_CENTERS.onboarding;
    PEOPLE.forEach((p, i) => {
      const k = ((time + i * (PING_PERIOD / PEOPLE.length)) % PING_PERIOD) / PING_PERIOD;
      const ping = pings.current[i];
      if (ping) {
        ping.position.set(cx + (p[0] - cx) * k, cy + (p[1] - cy) * k + Math.sin(k * Math.PI) * 0.4, cz + (p[2] - cz) * k);
        ping.scale.setScalar(Math.sin(k * Math.PI) * 1.2 + 0.2);
      }
      // The person node flashes as a ping arrives.
      const material = people.current[i];
      if (material) material.emissiveIntensity = (0.5 + Math.max(0, 1 - Math.abs(k - 0.95) * 8) * 2.5) * glow * 0.6;
    });

    // Compliance: envelope flies in → new field row slides into the table → holds → resets.
    // Mobile: the compliance story (email in → new field) is scrubbed in the second half.
    const t =
      sp !== null ? MathUtils.clamp((sp - 0.45) / 0.5, 0, 1) * (COMPLIANCE_CYCLE - 0.8) : weight > 0.5 ? time % COMPLIANCE_CYCLE : 0;
    const fly = MathUtils.clamp(t / 1.4, 0, 1);
    const [qx, qy, qz] = CLUSTER_CENTERS.compliance;
    if (envelope.current) {
      envelope.current.visible = fly > 0 && fly < 1;
      envelope.current.position.set(7.5 + (qx - 7.5) * fly, 3 + (qy - 3) * fly, 1.5 + (qz - 1.5) * fly);
      envelope.current.scale.setScalar(1 - fly * 0.5);
    }
    const slide = MathUtils.smoothstep(t, 1.7, 2.6) * (1 - MathUtils.smoothstep(t, COMPLIANCE_CYCLE - 0.6, COMPLIANCE_CYCLE));
    if (newRow.current) {
      newRow.current.position.x = TABLE_POS[0] + (1 - slide) * 2.2;
      newRow.current.visible = slide > 0.01;
    }
    if (newRowLabel.current) newRowLabel.current.material.opacity = slide;
  });

  const hitHandlers = (id: ClusterId) => ({
    onPointerOver: () => {
      focus.current.target = id;
    },
    onPointerOut: () => {
      if (focus.current.target === id) focus.current.target = null;
    },
    // Tap on touch devices toggles the highlight (and pins it over the scroll-driven one).
    onClick: () => {
      const next = focus.current.target === id ? null : id;
      focus.current.target = next;
      focus.current.manual = next;
    },
  });

  const titles = { onboarding: getProject("onboarding-agent")?.title ?? "", compliance: getProject("compliance-agent")?.title ?? "" };

  return (
    <Station ref={ref} id="agents">
      <group scale={0.72}>
      {/* Nodes: one instanced draw call. */}
      <instancedMesh ref={nodes} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Connections, one LineSegments per group so each cluster can light up on its own. */}
      {(Object.keys(graph.edges) as (ClusterId | "bridge")[]).map((id) => (
        <lineSegments key={id}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[graph.edges[id], 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            ref={(m) => {
              lines.current[id] = m;
            }}
            color={base[id].clone().multiplyScalar(glow * 0.9)}
            transparent
            opacity={0.3}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}

      {/* Cluster halos, labels and invisible hit spheres for hover/tap. */}
      {(Object.keys(CLUSTER_CENTERS) as ClusterId[]).map((id) => (
        <group key={id} position={CLUSTER_CENTERS[id]}>
          <Glow color={base[id]} size={5.5} opacity={0.14} />
          <Label text={titles[id]} color={palette.css.gold} height={0.3} position={[0, -2, 0.4]} opacity={0.95} />
          <mesh {...hitHandlers(id)}>
            <sphereGeometry args={[1.9, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Onboarding: people + reminder pings. */}
      {PEOPLE.map((p, i) => (
        <group key={i}>
          <mesh position={p}>
            <sphereGeometry args={[0.11, 20, 20]} />
            <meshStandardMaterial
              ref={(m) => {
                people.current[i] = m;
              }}
              color={palette.color.heading}
              emissive={palette.color.heading}
              emissiveIntensity={0.6}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              pings.current[i] = m;
            }}
          >
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 1.6)} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Compliance: the table that receives a new field. */}
      <group position={TABLE_POS}>
        {Array.from({ length: ROWS }, (_, r) => (
          <RoundedBox key={r} args={[1.5, 0.12, 0.9]} radius={0.03} smoothness={2} position={[0, r * 0.2, 0]}>
            <meshStandardMaterial color={palette.color.surface} emissive={palette.color["accent-2"]} emissiveIntensity={0.35} toneMapped={false} />
          </RoundedBox>
        ))}
      </group>
      <group ref={newRow} position={[TABLE_POS[0], TABLE_POS[1] + ROWS * 0.2, TABLE_POS[2]]} visible={false}>
        <RoundedBox args={[1.5, 0.12, 0.9]} radius={0.03} smoothness={2}>
          <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 1.2)} toneMapped={false} />
        </RoundedBox>
      </group>
      <Label
        ref={newRowLabel}
        text={sceneLabels.newField}
        color={palette.css.gold}
        height={0.2}
        position={[TABLE_POS[0], TABLE_POS[1] + ROWS * 0.2 + 0.38, TABLE_POS[2]]}
        opacity={0}
      />
      <Envelope ref={envelope} size={0.6} />
      </group>
    </Station>
  );
}
