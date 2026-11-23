"use client";

import { useRef } from "react";
import { MathUtils, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { Anchored } from "@/components/three/flow/Anchored";
import { flow } from "@/components/three/flow/sync";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";
import { flowInput } from "@/store/flow";

const PULSE_PERIOD = 3.4;

/**
 * 01 — The Spark (flow). The packet sits at the centre of this slot (FlowPacket); the station
 * frames it with two orbit rings and a slow shockwave. Dragging the packet (SparkDrag in the
 * HTML) also tilts the rings a little, so the whole object feels physical.
 * 10 units = the slot's width; the packet's radius here is ~1.7 units.
 */
export function FlowSpark() {
  const { palette, glow } = useScene();
  const rings = useRef<Group>(null);
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const wave = useRef<Mesh>(null);

  return (
    <Anchored
      id="spark"
      onFrame={(state, delta, { settle, scale }) => {
        const calm = flow.reduced;
        if (rings.current) {
          // Lean the rings with the drag (px → radians), damped.
          rings.current.rotation.y = MathUtils.damp(rings.current.rotation.y, (flowInput.spark.x / scale) * 0.06, 6, delta);
          rings.current.rotation.x = MathUtils.damp(rings.current.rotation.x, (flowInput.spark.y / scale) * 0.06, 6, delta);
          rings.current.scale.setScalar(0.6 + 0.4 * settle);
        }
        if (!calm) {
          if (ringA.current) ringA.current.rotation.z += delta * 0.22;
          if (ringB.current) ringB.current.rotation.z -= delta * 0.15;
        }
        if (wave.current) {
          const k = calm ? 0 : (state.clock.elapsedTime % PULSE_PERIOD) / PULSE_PERIOD;
          wave.current.scale.setScalar(2 + k * 3.2);
          (wave.current.material as MeshBasicMaterial).opacity = calm ? 0 : (1 - k) ** 2 * 0.3 * settle;
        }
      }}
    >
      <group ref={rings}>
        <mesh ref={ringA} rotation={[1.15, 0.3, 0]}>
          <torusGeometry args={[2.9, 0.03, 8, 160]} />
          <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} />
        </mesh>
        <mesh ref={ringB} rotation={[1.35, -0.5, 0.4]}>
          <torusGeometry args={[3.8, 0.022, 8, 200]} />
          <meshBasicMaterial color={palette.color["accent-2"].clone().multiplyScalar(glow * 0.85)} toneMapped={false} transparent opacity={0.75} />
        </mesh>
      </group>
      <mesh ref={wave}>
        <ringGeometry args={[0.98, 1, 96]} />
        <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} transparent depthWrite={false} />
      </mesh>
      <Glow color={palette.color["accent-2"]} size={11} opacity={0.12} />
    </Anchored>
  );
}
