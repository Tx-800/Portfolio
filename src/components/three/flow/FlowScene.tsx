"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { MathUtils, type PerspectiveCamera } from "three";
import { FlowPacket } from "@/components/three/flow/FlowPacket";
import { FlowPipeline } from "@/components/three/flow/FlowPipeline";
import { FlowSpark } from "@/components/three/flow/FlowSpark";
import { FlowWebsites } from "@/components/three/flow/FlowWebsites";
import { flow } from "@/components/three/flow/sync";
import { readPalette } from "@/components/three/palette";
import { SceneProvider, type Tier } from "@/components/three/SceneContext";
import { useUi } from "@/store/ui";

/** Vertical field of view. Any value works; the camera distance is derived from it. */
const FOV = 30;

interface FlowSceneProps {
  screenshots: Record<string, string>;
  onReady: () => void;
}

/**
 * The single transparent canvas of the flow page, layered above the text (pointer-events: none).
 * Phones get the light tier: no bloom, DPR ≤ 1.5, simple materials.
 */
export default function FlowScene({ screenshots, onReady }: FlowSceneProps) {
  const palette = useMemo(() => readPalette(), []);
  const [tier] = useState<Tier>(() => (window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 1024 ? "low" : "high"));
  const settings = useMemo(() => ({ tier, palette, glow: tier === "high" ? 1.8 : 1.3, screenshots }), [tier, palette, screenshots]);
  const covered = useUi((s) => s.overlayOpen);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={covered ? "never" : "always"}
      // Transparent: the page shows through; the 3D sits on top of it.
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: FOV, near: 10, far: 20000, position: [0, 0, 1000] }}
      style={{ pointerEvents: "none" }}
    >
      <SceneProvider value={settings}>
        <FlowSync />
        <FlowCamera />
        <ambientLight color={palette.color.heading} intensity={0.55} />
        <hemisphereLight args={[palette.color.gold, palette.color.bg, 0.5]} />
        <directionalLight color={palette.color.heading} position={[-300, 600, 800]} intensity={1.4} />

        <FlowSpark />
        <FlowWebsites />
        <FlowPipeline />
        <FlowPacket />
        <ReadySignal onReady={onReady} />
      </SceneProvider>
    </Canvas>
  );
}

/**
 * Runs FIRST every frame (priority −10), before anything is positioned or drawn:
 *   1. read window.scrollY once,
 *   2. move the absolutely positioned canvas so it covers the viewport (plus padding) again,
 *   3. publish scrollY so every station and the packet use the same value this frame.
 * (R3F renders automatically after all useFrame callbacks; a negative priority doesn't take
 * over rendering.)
 */
function FlowSync() {
  useFrame(() => {
    const scrollY = window.scrollY;
    flow.scrollY = scrollY;
    flow.vh = window.innerHeight;
    // Canvas top lands at viewport y = −pad, whatever the scroll position.
    if (flow.wrapper) flow.wrapper.style.transform = `translate3d(0, ${(scrollY - flow.rootTop - flow.pad).toFixed(1)}px, 0)`;
  }, -10);
  return null;
}

/**
 * Pixel-perfect perspective camera: placed so that the z = 0 plane maps 1:1 to CSS pixels.
 * Visible height at distance D is 2·D·tan(fov/2); setting it equal to the canvas height gives
 * D = (height / 2) / tan(fov / 2). Objects with depth still get real perspective.
 */
function FlowCamera() {
  const last = useRef(0);
  // Runs right after FlowSync; only does work when the canvas height changes.
  useFrame((state) => {
    if (state.size.height === last.current) return;
    last.current = state.size.height;
    const camera = state.camera as PerspectiveCamera;
    const distance = state.size.height / 2 / Math.tan(MathUtils.degToRad(FOV / 2));
    camera.fov = FOV;
    camera.position.set(0, 0, distance);
    camera.near = distance * 0.1;
    camera.far = distance * 4;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, -9);
  return null;
}

function ReadySignal({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}
