"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type PerspectiveCamera } from "three";
import { core, FOV, WORLD_PER_LEG } from "@/components/core/timeline";
import { DataCore } from "@/components/three/core/DataCore";
import { FlySpace } from "@/components/three/core/FlySpace";
import { Gates } from "@/components/three/core/Gates";
import { readPalette } from "@/components/three/palette";
import { SceneProvider } from "@/components/three/SceneContext";

interface CoreCanvasProps {
  screenshots: Record<string, string>;
  onReady: () => void;
}

/**
 * The WebGL layer of the mobile Data Core layout. It never runs its own loop
 * (frameloop="never"): CoreEngine calls core.render(time) once per frame, right after updating
 * the HTML, so text and 3D always show the same moment.
 * Phone tier: DPR ≤ 1.5, no postprocessing, everything additive points/lines + glow sprites.
 */
export default function CoreCanvas({ screenshots, onReady }: CoreCanvasProps) {
  const palette = useMemo(() => readPalette(), []);
  const settings = useMemo(() => ({ tier: "low" as const, palette, glow: 1.3, screenshots }), [palette, screenshots]);

  return (
    <Canvas frameloop="never" dpr={[1, 1.5]} gl={{ alpha: true, antialias: false, powerPreference: "high-performance", stencil: false, depth: false }} camera={{ fov: FOV, near: 0.1, far: 140 }}>
      <SceneProvider value={settings}>
        <RenderHook onReady={onReady} />
        <CameraRig />
        <FlySpace />
        <Gates />
        <DataCore />
      </SceneProvider>
    </Canvas>
  );
}

/**
 * The camera flies along −z: its depth is the distance travelled (core.s legs × WORLD_PER_LEG).
 * It always looks at the Core (which flies ahead of it), so the Core stays centred; a tiny
 * sway keeps the space alive. setViewOffset centres the picture in the VISIBLE part of the
 * 100lvh canvas (the mobile URL bar may cover its bottom).
 */
function CameraRig() {
  const last = useRef("");
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const { width, height } = state.size;
    const visible = Math.min(window.innerHeight, height);
    const key = `${width}x${height}x${visible}`;
    if (key !== last.current) {
      last.current = key;
      camera.setViewOffset(width, height, 0, (height - visible) / 2, width, height);
      camera.updateProjectionMatrix();
    }
    const z = -core.s * WORLD_PER_LEG;
    const time = state.clock.elapsedTime;
    camera.position.set(Math.sin(time * 0.4) * 0.05, Math.cos(time * 0.33) * 0.04, z);
    camera.lookAt(0, 0, z - core.coreDist);
  }, -1);
  return null;
}

/** Hands the engine a render function (advance = run all useFrame callbacks + draw once). */
function RenderHook({ onReady }: { onReady: () => void }) {
  const advance = useThree((s) => s.advance);
  const done = useRef(false);
  useEffect(() => {
    core.render = (time) => advance(time);
    return () => {
      core.render = null;
    };
  }, [advance]);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}
