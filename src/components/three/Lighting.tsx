"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { useScene } from "@/components/three/SceneContext";

/**
 * Low warm ambient + a key light. On desktop, a small procedural environment (lightformers,
 * no HDR download) gives metal and glass warm orange/pink reflections.
 * The moving rim/fill lights live in CameraRig; the packet carries its own light.
 */
export function Lighting() {
  const { palette, tier } = useScene();

  return (
    <>
      <ambientLight color={palette.color.heading} intensity={0.25} />
      <hemisphereLight args={[palette.color.gold, palette.color.bg, 0.35]} />
      <directionalLight color={palette.color.heading} position={[8, 12, 10]} intensity={1.3} />

      {tier === "high" && (
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} color={palette.color.accent} position={[-6, 3, 4]} scale={[8, 3, 1]} />
          <Lightformer form="rect" intensity={2.5} color={palette.color["accent-2"]} position={[6, -1, 3]} scale={[6, 4, 1]} />
          <Lightformer form="ring" intensity={2} color={palette.color.gold} position={[0, 6, -6]} scale={4} />
          <Lightformer form="rect" intensity={0.6} color={palette.color.heading} position={[0, 0, -10]} scale={[20, 6, 1]} />
        </Environment>
      )}
    </>
  );
}
