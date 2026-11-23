"use client";

import { RoundedBox } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, MathUtils, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial, type Sprite } from "three";
import { Envelope } from "@/components/three/Envelope";
import { Glow } from "@/components/three/Glow";
import { Label } from "@/components/three/Label";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";
import { getGlowTexture } from "@/components/three/textures";
import { sceneLabels } from "@/data/content";

const INDEX = stationIndex("watchtower");

/** Six tables on the platform (2 rows × 3). One of them goes stale. */
const TABLES: [number, number][] = [-2.1, 0, 2.1].flatMap((x) => [-0.8, 0.9].map((z) => [x, z] as [number, number]));
const STALE = TABLES.findIndex(([x, z]) => x === 0 && z === 0.9);
const TABLE_Y = -1.1;

/** One full story beat, in seconds: scan → table goes stale → alert → diagnosis → reset. */
const CYCLE = 8;
const SWEEP = 3.4; // the scanner crosses the platform in this time
const STALE_AT = SWEEP / 2; // the scanner reaches the middle column
const ALERT_AT = STALE_AT + 0.5;
const ALERT_FLIGHT = 1.3;
const LABEL_AT = ALERT_AT + 0.6;
const RESET_AT = CYCLE - 0.7;

/** Smooth 0→1 ramp between a and b. */
const ramp = (t: number, a: number, b: number) => MathUtils.smoothstep(t, a, b);

/**
 * 05 — The Watchtower. A beacon tower watches six tables on a platform. A scanning light sheet
 * sweeps across them; fresh tables answer with a warm orange pulse. One table turns cold blue
 * (stale, older than 24h), an envelope shoots out (the email alert) and a diagnostic label
 * appears ("schema change detected"). Then the cycle resets.
 */
export function WatchtowerStation() {
  const { palette, glow, tier } = useScene();
  const tables = useRef<(MeshStandardMaterial | null)[]>([]);
  const scanner = useRef<Group>(null);
  const beacon = useRef<MeshBasicMaterial>(null);
  const ring = useRef<Mesh>(null);
  const envelope = useRef<Group>(null);
  const label = useRef<Sprite>(null);
  const tag = useRef<Sprite>(null);
  const glowMap = useMemo(() => getGlowTexture(), []);
  const scratch = useRef({ color: new Color() });
  const scrub = useRef({ value: 0 });

  const ref = useStationFrame(INDEX, (state, delta, weight) => {
    const time = state.clock.elapsedTime;
    // Mobile stage: the scroll scrubs the story timeline (scan → stale → email → diagnosis).
    // Desktop: it loops on a timer while parked here; elsewhere everything rests "fresh".
    const sp = scrubbed(INDEX, scrub.current, delta);
    const t = sp !== null ? sp * (RESET_AT - 0.15) : weight > 0.5 ? time % CYCLE : 0;
    const { color } = scratch.current;

    // Scanner sheet: slides from left to right across the platform.
    const sweepK = MathUtils.clamp(t / SWEEP, 0, 1);
    const sweepX = -3.4 + sweepK * 6.8;
    if (scanner.current) {
      scanner.current.position.x = sweepX;
      scanner.current.visible = t > 0 && t < SWEEP;
    }

    // Tables: base warm glow + a pulse as the scanner passes. The stale one cools to blue.
    const staleK = ramp(t, STALE_AT, STALE_AT + 0.6) * (1 - ramp(t, RESET_AT, CYCLE));
    tables.current.forEach((material, i) => {
      if (!material) return;
      const d = TABLES[i][0] - sweepX;
      const pulse = t < SWEEP ? Math.exp(-(d * d) / 0.25) : 0;
      if (i === STALE) {
        color.copy(palette.color.accent).lerp(palette.color.stale, staleK);
        material.emissive.copy(color);
        material.emissiveIntensity = (0.55 + pulse * 1.6) * glow * (1 - staleK * 0.35);
      } else {
        material.emissiveIntensity = (0.5 + pulse * 1.8) * glow * 0.6;
      }
    });

    // Beacon on the tower: slow breathing light, ring spinning.
    if (beacon.current) beacon.current.color.copy(palette.color.gold).multiplyScalar(glow * (1.2 + Math.sin(time * 3) * 0.4));
    if (ring.current) ring.current.rotation.z += delta * 0.8;

    // Email alert: launches from the stale table, arcs up and out towards the viewer, fades.
    if (envelope.current) {
      const k = MathUtils.clamp((t - ALERT_AT) / ALERT_FLIGHT, 0, 1);
      const [sx, sz] = TABLES[STALE];
      envelope.current.visible = k > 0 && k < 1;
      envelope.current.position.set(sx + k * 3.2, TABLE_Y + 0.4 + Math.sin(k * Math.PI) * 1.6 + k * 1.6, sz + k * 1.4);
      envelope.current.rotation.set(0, -0.4 * k, 0.3 * Math.sin(k * Math.PI));
      envelope.current.scale.setScalar(0.6 + Math.sin(k * Math.PI) * 0.6);
    }

    // Labels: "stale > 24h" tag on the table, then the diagnosis above it.
    const tagK = staleK;
    const labelK = ramp(t, LABEL_AT, LABEL_AT + 0.5) * (1 - ramp(t, RESET_AT - 0.4, RESET_AT));
    if (tag.current) tag.current.material.opacity = tagK;
    if (label.current) {
      label.current.material.opacity = labelK;
      label.current.position.y = TABLE_Y + 1.55 + (1 - labelK) * -0.25;
    }
  });

  const pill = { fill: palette.css.bg, border: palette.css.stale };

  return (
    <Station ref={ref} id="watchtower">
      <group scale={0.85}>
      {/* Platform with a gold front edge. */}
      <RoundedBox args={[7.4, 0.16, 4.4]} radius={0.06} smoothness={3} position={[0, TABLE_Y - 0.2, 0]}>
        <meshStandardMaterial color={palette.color["surface-2"]} metalness={tier === "high" ? 0.7 : 0.3} roughness={0.35} />
      </RoundedBox>
      <mesh position={[0, TABLE_Y - 0.12, 2.21]}>
        <boxGeometry args={[7.2, 0.02, 0.02]} />
        <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow)} toneMapped={false} />
      </mesh>

      {/* Tables. */}
      {TABLES.map(([x, z], i) => (
        <RoundedBox key={i} args={[1.6, 0.22, 1.05]} radius={0.06} smoothness={3} position={[x, TABLE_Y, z]}>
          <meshStandardMaterial
            ref={(m) => {
              tables.current[i] = m;
            }}
            color={palette.color.surface}
            emissive={palette.color.accent}
            emissiveIntensity={0.6}
            metalness={0.3}
            roughness={0.4}
            toneMapped={false}
          />
        </RoundedBox>
      ))}

      {/* Watchtower: slim mast with a beacon and a spinning ring. */}
      <mesh position={[0, 0.5, -2.3]}>
        <cylinderGeometry args={[0.07, 0.12, 3.2, 16]} />
        <meshStandardMaterial color={palette.color["surface-2"]} metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 2.2, -2.3]}>
        <mesh>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshBasicMaterial ref={beacon} color={palette.color.gold} toneMapped={false} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[0.45, 0.012, 8, 96]} />
          <meshBasicMaterial color={palette.color.accent.clone().multiplyScalar(glow)} toneMapped={false} />
        </mesh>
        <Glow color={palette.color.gold} size={2.4} opacity={0.5} />
      </group>

      {/* Scanner: a vertical sheet of light sweeping across the tables, bright at its base. */}
      <group ref={scanner} visible={false}>
        <mesh position={[0, TABLE_Y + 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[4.4, 2]} />
          <meshBasicMaterial
            map={glowMap}
            color={palette.color.gold}
            transparent
            opacity={0.35}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, TABLE_Y + 0.13, 0]}>
          <boxGeometry args={[0.02, 0.02, 4.3]} />
          <meshBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 1.5)} toneMapped={false} />
        </mesh>
      </group>

      <Envelope ref={envelope} size={0.55} />

      <Label
        ref={tag}
        text={sceneLabels.stale}
        color={palette.css.stale}
        height={0.24}
        pill={pill}
        position={[TABLES[STALE][0], TABLE_Y + 0.4, TABLES[STALE][1] + 0.62]}
        opacity={0}
      />
      <Label
        ref={label}
        text={sceneLabels.staleDiagnosis}
        color={palette.css.stale}
        height={0.34}
        pill={pill}
        position={[TABLES[STALE][0], TABLE_Y + 1.55, TABLES[STALE][1]]}
        opacity={0}
      />

      <Glow color={palette.color.accent} size={10} opacity={0.1} position={[0, TABLE_Y, 0]} />
      </group>
    </Station>
  );
}
