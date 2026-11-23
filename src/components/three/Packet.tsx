"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { MathUtils, Vector3, type Group, type ShaderMaterial } from "three";
import { Glow } from "@/components/three/Glow";
import { getCurves, stationIndex, STATION_ORDER, STATIONS } from "@/components/three/path";
import { rig, stationWeight } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { sceneProgress } from "@/store/journey";

const SPARK = stationIndex("spark");

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vPos = position;
    gl_Position = projectionMatrix * mv;
  }
`;

// Signature gradient (gold → orange → pink) flowing over the surface, brighter at the rim.
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uGold;
  uniform vec3 uOrange;
  uniform vec3 uPink;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vPos;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.2);
    float g = 0.5 + 0.5 * sin(vPos.y * 7.0 + vPos.x * 4.0 + uTime * 1.8);
    vec3 grad = g < 0.5 ? mix(uGold, uOrange, g * 2.0) : mix(uOrange, uPink, (g - 0.5) * 2.0);
    vec3 color = mix(grad, uPink, fresnel * 0.55) * (1.1 + fresnel * 2.2) * uIntensity;
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/**
 * The packet's look, shared by the desktop journey (Packet) and the mobile flow page
 * (FlowPacket): the gradient core with its heartbeat pulse and two halos, radius 0.32.
 * Pass `calm` to stop the idle spin/pulse (reduced motion).
 */
export function PacketBody({ calm = false }: { calm?: boolean }) {
  const { palette, glow } = useScene();
  const core = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: glow },
      uGold: { value: palette.color.gold },
      uOrange: { value: palette.color.accent },
      uPink: { value: palette.color["accent-2"] },
    }),
    [palette, glow],
  );

  useFrame((state, rawDelta) => {
    if (calm) return;
    const delta = Math.min(rawDelta, 0.1);
    const time = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y += delta * 0.7;
      core.current.rotation.x += delta * 0.3;
      // A slow "heartbeat" pulse.
      core.current.scale.setScalar(1 + Math.sin(time * 2.4) * 0.06);
    }
    if (material.current) material.current.uniforms.uTime.value = time;
  });

  return (
    <>
      <group ref={core}>
        <mesh>
          <icosahedronGeometry args={[0.32, 5]} />
          <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} toneMapped={false} />
        </mesh>
      </group>
      <Glow color={palette.color.accent} size={2.6} opacity={0.65} />
      <Glow color={palette.color["accent-2"]} size={6} opacity={0.18} />
    </>
  );
}

/**
 * The data packet on the desktop journey: the hero of the story. Follows the packet curve at
 * the camera's smoothed t, floats gently, and (at The Spark) drifts towards the cursor.
 */
export function Packet() {
  const { palette } = useScene();
  const curves = useMemo(() => getCurves(), []);
  const group = useRef<Group>(null);
  // Mutated every frame, so it lives in a ref.
  const scratchRef = useRef({ p: new Vector3(), follow: new Vector3() });

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const time = state.clock.elapsedTime;
    const scratch = scratchRef.current;
    curves.packet.getPoint(rig.t, scratch.p);

    // At The Spark the packet leans towards the pointer (fades out as we leave).
    const w = stationWeight(SPARK);
    scratch.follow.x = MathUtils.damp(scratch.follow.x, state.pointer.x * 1.2 * w, 3, delta);
    scratch.follow.y = MathUtils.damp(scratch.follow.y, state.pointer.y * 0.7 * w, 3, delta);

    // Per-station extras while parked, faded in/out by station weight:
    //   orbit       → circle the station (The Builder's skill cluster)
    //   packetScale → shrink to settle into something (the inbox in Your Turn)
    let ox = 0;
    let oy = 0;
    let oz = 0;
    let scale = 1;
    STATION_ORDER.forEach((id, i) => {
      const def = STATIONS[id];
      if (!def.orbit && def.packetScale === undefined) return;
      const w = stationWeight(i);
      if (w <= 0) return;
      const s = w * w * (3 - 2 * w); // smoothstep: eases the orbit in and out
      if (def.orbit) {
        const a = time * 0.55;
        ox += Math.cos(a) * def.orbit * s;
        oz += Math.sin(a) * def.orbit * s;
        oy += Math.sin(a * 0.8) * def.orbit * 0.22 * s;
      }
      if (def.packetScale !== undefined) {
        // Mobile stage: settle in step with the scrubbed scene instead of on arrival.
        const p = sceneProgress(i);
        const k = p === null ? s : s * MathUtils.smoothstep(p, 0.35, 0.85);
        scale *= 1 + (def.packetScale - 1) * k;
      }
    });

    // Mobile stage, The Spark: the packet grows from a spark to full size as you scroll.
    const sparkP = sceneProgress(SPARK);
    if (sparkP !== null) scale *= 1 - stationWeight(SPARK) * (1 - (0.3 + 0.7 * MathUtils.smoothstep(sparkP, 0, 0.6)));

    group.current?.position.set(
      scratch.p.x + scratch.follow.x + ox,
      scratch.p.y + scratch.follow.y + oy + Math.sin(time * 1.6) * 0.08,
      scratch.p.z + oz,
    );
    group.current?.scale.setScalar(scale);
  });

  return (
    <group ref={group}>
      <PacketBody />
      {/* The packet lights whatever it passes, which makes stations feel connected to it. */}
      <pointLight color={palette.color.accent} intensity={14} distance={9} decay={2} />
    </group>
  );
}
