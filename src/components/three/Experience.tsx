"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CameraRig } from "@/components/three/CameraRig";
import { DataDust } from "@/components/three/DataDust";
import { Effects } from "@/components/three/Effects";
import { Lighting } from "@/components/three/Lighting";
import { Packet } from "@/components/three/Packet";
import { readPalette } from "@/components/three/palette";
import { SceneProvider, type Tier } from "@/components/three/SceneContext";
import { useUi } from "@/store/ui";
import { AgentsStation } from "@/components/three/stations/AgentsStation";
import { BuilderStation } from "@/components/three/stations/BuilderStation";
import { CockpitStation } from "@/components/three/stations/CockpitStation";
import { ContactStation } from "@/components/three/stations/ContactStation";
import { ImpactStation } from "@/components/three/stations/ImpactStation";
import { PipelineStation } from "@/components/three/stations/PipelineStation";
import { SparkStation } from "@/components/three/stations/SparkStation";
import { WatchtowerStation } from "@/components/three/stations/WatchtowerStation";
import { WebsitesStation } from "@/components/three/stations/WebsitesStation";

/** Phones, touch-first and low-power devices start on the light tier. */
function detectTier(): Tier {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const small = window.innerWidth < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
  return small || coarse || weak ? "low" : "high";
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

interface ExperienceProps {
  onReady: () => void;
  screenshots: Record<string, string>;
}

/**
 * The one fixed, full-screen 3D canvas behind the journey. Client-only (loaded by
 * JourneyCanvas with ssr: false after first paint).
 */
export default function Experience({ onReady, screenshots }: ExperienceProps) {
  const [tier, setTier] = useState<Tier>(detectTier);
  const palette = useMemo(() => readPalette(), []);
  const settings = useMemo(
    () => ({ tier, palette, glow: tier === "high" ? 2.2 : 1.3, screenshots }),
    [tier, palette, screenshots],
  );
  // Phones: pixel density costs more than anything else, so cap it lower than on laptops.
  const phone = useMemo(() => window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768, []);
  const dpr: [number, number] = tier === "high" ? [1, 2] : tier === "low" ? [1, phone ? 1.25 : 1.5] : [1, 1];
  // Stop rendering entirely while the tab is hidden.
  const visible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => true);
  // A case-study overlay covers the canvas: no need to keep rendering behind it.
  // …or the mobile stage has slid away while long content scrolls past.
  const covered = useUi((s) => s.overlayOpen || s.stageHidden);

  return (
    <Canvas
      dpr={dpr}
      frameloop={visible && !covered ? "always" : "never"}
      // Listen to pointer events on the whole page: the canvas sits behind the HTML.
      eventSource={document.body}
      eventPrefix="client"
      camera={{ fov: 40, near: 0.1, far: 140, position: [0, 0.5, 28] }}
      gl={{ antialias: tier === "low", powerPreference: "high-performance", stencil: false }}
    >
      <SceneProvider value={settings}>
        {/* Sustained low frame rate → step down a tier (high → low → min) and stay there. */}
        <PerformanceMonitor onDecline={() => setTier((t) => (t === "high" ? "low" : "min"))} flipflops={3} />
        <color attach="background" args={[palette.color.bg]} />
        <fog attach="fog" args={[palette.color.bg, 20, 60]} />

        <Lighting />
        <CameraRig />
        <DataDust count={tier === "high" ? 2400 : tier === "low" ? 650 : 300} />
        <Packet />

        <SparkStation />
        <WebsitesStation />
        <CockpitStation />
        <PipelineStation />
        <WatchtowerStation />
        <AgentsStation />
        <ImpactStation />
        <BuilderStation />
        <ContactStation />

        {tier === "high" && <Effects />}
        <ReadySignal onReady={onReady} />
      </SceneProvider>
    </Canvas>
  );
}

/** Calls onReady after the first rendered frame, so the canvas fades in already drawn. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}
