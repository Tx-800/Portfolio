"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, DoubleSide, EdgesGeometry, MathUtils, Shape, ShapeGeometry, type Group, type LineBasicMaterial, type Sprite } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";

const INDEX = stationIndex("contact");
const W = 3.6;
const H = 2.4;
const DEPTH = 0.22;
/**
 * Flap angle around its top hinge (x axis). The flap hangs down in local −y, so a positive angle
 * swings it up and back (open); a tiny negative angle lifts it just off the front face (closed).
 */
const FLAP_OPEN = 2.5;
const FLAP_CLOSED = -0.04;

/**
 * 09 — Your Turn. A large glowing envelope waits with its flap open. As the packet arrives and
 * settles in (path.ts `packetScale`) the flap closes, the edges flare up and a warm halo breathes:
 * "your data could be next".
 */
export function ContactStation() {
  const { palette, glow, tier } = useScene();
  const flap = useRef<Group>(null);
  const edges = useRef<LineBasicMaterial>(null);
  const halo = useRef<Sprite>(null);
  const state = useRef({ closed: 0 });
  const scrub = useRef({ value: 0 });

  // Triangle flap hanging from the top edge (hinge at local y = 0).
  const flapGeometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-W / 2, 0);
    shape.lineTo(W / 2, 0);
    shape.lineTo(0, -H * 0.58);
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);
  const outline = useMemo(() => {
    const box = new BoxGeometry(W + 0.04, H + 0.04, DEPTH + 0.04);
    const geometry = new EdgesGeometry(box);
    box.dispose();
    return geometry;
  }, []);
  useEffect(
    () => () => {
      flapGeometry.dispose();
      outline.dispose();
    },
    [flapGeometry, outline],
  );

  const ref = useStationFrame(INDEX, (frame, delta, weight) => {
    const s = state.current;
    // Mobile stage: the flap closes as the end of the page is reached (scrubbed).
    // Desktop: close once the packet is almost home; reopen as we leave.
    const sp = scrubbed(INDEX, scrub.current, delta);
    s.closed = sp !== null ? MathUtils.smoothstep(sp, 0.5, 0.9) : MathUtils.damp(s.closed, weight > 0.85 ? 1 : 0, 3, delta);
    if (flap.current) flap.current.rotation.x = MathUtils.lerp(FLAP_OPEN, FLAP_CLOSED, s.closed);
    if (edges.current) edges.current.color.copy(palette.color.gold).multiplyScalar(glow * (0.6 + s.closed * 0.9));
    // Once sealed, a warm halo behind the envelope breathes slowly.
    if (halo.current) halo.current.material.opacity = 0.08 + s.closed * (0.14 + Math.sin(frame.clock.elapsedTime * 1.6) * 0.06);
  });

  return (
    <Station ref={ref} id="contact">
      <group position={[0, -0.25, -DEPTH / 2]}>
        <RoundedBox args={[W, H, DEPTH]} radius={0.08} smoothness={4}>
          <meshStandardMaterial
            color={palette.color["surface-2"]}
            emissive={palette.color["accent-2"]}
            emissiveIntensity={0.12}
            metalness={tier === "high" ? 0.6 : 0.3}
            roughness={0.35}
          />
        </RoundedBox>
        <lineSegments geometry={outline}>
          <lineBasicMaterial ref={edges} color={palette.color.gold} toneMapped={false} />
        </lineSegments>

        {/* Lower V of the envelope front: two glowing lines meeting under the centre. */}
        {[-1, 1].map((side) => {
          const len = Math.hypot(W / 2, H * 0.42);
          const angle = Math.atan2(H * 0.42, W / 2);
          return (
            <mesh key={side} position={[(side * W) / 4, -H / 2 + (H * 0.42) / 2, DEPTH / 2 + 0.005]} rotation={[0, 0, -side * angle]}>
              <planeGeometry args={[len, 0.02]} />
              <meshBasicMaterial color={palette.color["accent-2"].clone().multiplyScalar(glow)} toneMapped={false} />
            </mesh>
          );
        })}

        {/* The flap, hinged on the top edge. */}
        <group ref={flap} position={[0, H / 2, DEPTH / 2 + 0.01]} rotation={[FLAP_OPEN, 0, 0]}>
          <mesh geometry={flapGeometry}>
            <meshStandardMaterial color={palette.color.surface} emissive={palette.color.accent} emissiveIntensity={0.25} side={DoubleSide} metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      </group>

      <Glow ref={halo} color={palette.color["accent-2"]} size={9} opacity={0.08} position={[0, -0.25, -0.6]} />
      <Glow color={palette.color.gold} size={4} opacity={0.15} position={[0, 0.4, 0.2]} />
    </Station>
  );
}
