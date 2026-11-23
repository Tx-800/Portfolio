"use client";

import { RoundedBox } from "@react-three/drei";
import { useRef } from "react";
import { MathUtils, type Mesh, type MeshBasicMaterial } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";

const INDEX = stationIndex("impact");
const SCREEN = { w: 6, h: 3.4 };
const BASELINE = -1.25;

type Tone = "muted" | "gold" | "accent" | "accent-2";
interface Bar {
  x: number;
  height: number;
  width: number;
  tone: Tone;
}

/**
 * Abstract bars only: the real numbers live in the HTML metric tiles. Each group shows the
 * shape of a result:
 *  - onboarding / compliance: a tall muted "before" bar next to a tiny glowing "after" bar
 *  - freshness: seven equal bars, a steady daily rhythm
 */
const BARS: Bar[] = [
  { x: -2.15, height: 2.2, width: 0.42, tone: "muted" },
  { x: -1.6, height: 0.22, width: 0.42, tone: "gold" },
  { x: -0.3, height: 1.5, width: 0.42, tone: "muted" },
  { x: 0.25, height: 0.22, width: 0.42, tone: "accent" },
  ...Array.from({ length: 7 }, (_, i) => ({ x: 1.25 + i * 0.22, height: 0.9, width: 0.13, tone: "accent-2" as Tone })),
];
/** Seconds between bars starting to grow, and the time for each to grow. */
const STAGGER = 0.12;
const GROW = 0.7;

/**
 * 07 — The Impact. A floating glass dashboard. When the camera arrives the screen powers on and
 * the bars grow in one after another; leaving powers it down again.
 */
export function ImpactStation() {
  const { palette, glow, tier } = useScene();
  const screen = useRef<MeshBasicMaterial>(null);
  const bars = useRef<(Mesh | null)[]>([]);
  const state = useRef({ power: 0, since: 0 });
  const scrub = useRef({ value: 0 });

  const ref = useStationFrame(INDEX, (frame, delta, weight) => {
    const s = state.current;
    const sp = scrubbed(INDEX, scrub.current, delta);
    const on = weight > 0.6;
    s.power = MathUtils.damp(s.power, on ? 1 : 0, 3, delta);
    s.since = on ? s.since + delta : 0;

    if (screen.current) screen.current.color.copy(palette.color.surface).lerp(palette.color["surface-2"], s.power).multiplyScalar(0.6 + s.power * 0.8);

    bars.current.forEach((bar, i) => {
      if (!bar) return;
      // Mobile stage: bars grow (and shrink back) with the scroll; desktop: timed after arrival.
      const grow =
        sp !== null
          ? MathUtils.smoothstep(sp * 1.3, i * 0.06, i * 0.06 + 0.35)
          : on
            ? MathUtils.smoothstep(s.since, i * STAGGER, i * STAGGER + GROW)
            : 0;
      const def = BARS[i];
      // Freshness bars breathe gently once grown: the daily check keeps running.
      const breathe = def.tone === "accent-2" ? 1 + Math.sin(frame.clock.elapsedTime * 2 + i) * 0.06 : 1;
      const h = Math.max(0.001, def.height * grow * breathe);
      bar.scale.y = h;
      bar.position.y = BASELINE + h / 2;
    });
  });

  const toneColor = (tone: Tone) =>
    tone === "muted" ? palette.color["border-strong"].clone().multiplyScalar(1.4) : palette.color[tone].clone().multiplyScalar(glow * 1.1);

  return (
    <Station ref={ref} id="impact">
      <group rotation={[0, 0, 0.015]} scale={0.85}>
        {/* Frame + screen. */}
        <RoundedBox args={[SCREEN.w + 0.3, SCREEN.h + 0.3, 0.14]} radius={0.14} smoothness={4}>
          <meshStandardMaterial color={palette.color["surface-2"]} metalness={tier === "high" ? 0.75 : 0.3} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screen} color={palette.color.surface} toneMapped={false} />
        </mesh>

        {/* Header strip: three dots + a title bar, like the HTML metric tiles. */}
        {[palette.color.gold, palette.color.accent, palette.color["accent-2"]].map((c, i) => (
          <mesh key={i} position={[-SCREEN.w / 2 + 0.3 + i * 0.2, SCREEN.h / 2 - 0.28, 0.09]}>
            <circleGeometry args={[0.05, 20]} />
            <meshBasicMaterial color={c.clone().multiplyScalar(glow)} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[-SCREEN.w / 2 + 1.5, SCREEN.h / 2 - 0.28, 0.09]}>
          <planeGeometry args={[1.2, 0.06]} />
          <meshBasicMaterial color={palette.color["border-strong"]} toneMapped={false} />
        </mesh>

        {/* Baseline. */}
        <mesh position={[0, BASELINE - 0.02, 0.09]}>
          <planeGeometry args={[SCREEN.w - 0.6, 0.015]} />
          <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 0.8)} toneMapped={false} />
        </mesh>

        {/* Bars: unit-height boxes scaled in y each frame. */}
        {BARS.map((bar, i) => (
          <mesh
            key={i}
            ref={(m) => {
              bars.current[i] = m;
            }}
            position={[bar.x, BASELINE, 0.16]}
            scale={[1, 0.001, 1]}
          >
            <boxGeometry args={[bar.width, 1, 0.1]} />
            <meshBasicMaterial color={toneColor(bar.tone)} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <Glow color={palette.color["accent-2"]} size={12} opacity={0.12} position={[0, 0, -0.6]} />
      <Glow color={palette.color.accent} size={7} opacity={0.1} position={[0, -1.6, 0.3]} />
    </Station>
  );
}
