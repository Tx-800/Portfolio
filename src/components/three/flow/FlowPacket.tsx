"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3, type Group } from "three";
import { debugEnabled } from "@/components/three/flow/Anchored";
import { docToWorld, flow } from "@/components/three/flow/sync";
import { PacketBody } from "@/components/three/Packet";
import { useScene } from "@/components/three/SceneContext";
import { tilt } from "@/components/three/deviceTilt";
import { flowInput } from "@/store/flow";

/**
 * Where the packet "lives" in each station: a point inside the anchor (fractions of its box)
 * and its radius as a fraction of the anchor's width. In order of the page.
 */
export const PACKET_HOMES = [
  { anchor: "spark", fx: 0.5, fy: 0.5, radius: 0.17 }, // the hero, big, centre stage
  { anchor: "websites", fx: 0.5, fy: 0.1, radius: 0.055 }, // hovering above the active window
  { anchor: "pipeline", fx: 0.5, fy: 0.5, radius: 0.045 }, // inside the crystal cube
] as const;

/** Packet body radius in its own units (PacketBody is modelled at 0.32). */
const BODY_RADIUS = 0.32;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/**
 * The packet travels between anchors as the page scrolls.
 *
 * 1. For every station we know the scroll position at which its slot is centred on screen:
 *    s_i = slotCentreDocY_i − viewportHeight / 2. That's where the packet is "home".
 * 2. The current scroll gives a continuous route position P = i + f, where f is how far we are
 *    between s_i and s_(i+1). Scrolling up runs it backwards.
 * 3. P is damped (inertia): the packet lags a little behind fast scrolls and glides to a stop.
 *    Because P is a route position (not a screen position), the packet stays on its path
 *    relative to the page and never "floats" with the screen.
 * 4. Between homes it follows a curve that swings out to the right edge, eased in/out,
 *    and its size blends from one station's scale to the next.
 * Reduced motion: no flight; it appears at whichever home is closest to the screen centre.
 */
export function FlowPacket() {
  const { palette } = useScene();
  const group = useRef<Group>(null);
  const state = useRef({ route: 0, initialised: false, drag: { x: 0, y: 0, vx: 0, vy: 0 }, v: new Vector3(), p: new Vector3() });

  useFrame((frame, rawDelta) => {
    const g = group.current;
    if (!g) return;
    const s = state.current;
    const delta = Math.min(rawDelta, 0.1);
    const homes = PACKET_HOMES.map((h) => {
      const box = flow.anchors.get(h.anchor);
      return box ? { x: box.x + box.w * h.fx, y: box.y + box.h * h.fy, r: box.w * h.radius, centre: box.y + box.h / 2 } : null;
    });
    if (homes.some((h) => h === null)) return;
    const pts = homes as { x: number; y: number; r: number; centre: number }[];

    // 1–2. Route position from scroll.
    const centreScroll = pts.map((h) => h.centre - flow.vh / 2);
    let target = 0;
    if (flow.scrollY >= centreScroll[pts.length - 1]) target = pts.length - 1;
    else {
      for (let i = 0; i < pts.length - 1; i++) {
        if (flow.scrollY < centreScroll[i + 1]) {
          target = i + MathUtils.clamp((flow.scrollY - centreScroll[i]) / (centreScroll[i + 1] - centreScroll[i]), 0, 1);
          break;
        }
      }
    }

    // 3. Inertia (or none with reduced motion).
    if (flow.reduced) s.route = Math.round(target);
    else if (!s.initialised) s.route = target;
    else s.route = MathUtils.damp(s.route, target, 4.5, delta);
    s.initialised = true;

    // 4. Position along the curve between home i and i+1.
    const i = Math.min(Math.floor(s.route), pts.length - 2);
    const f = easeInOut(MathUtils.clamp(s.route - i, 0, 1));
    const a = pts[i];
    const b = pts[i + 1];
    // Sideways arc along the RIGHT edge: captions stop 4.5rem short of it (FlowChapter), so the
    // packet never flies over text. (Control point past the edge → the curve peaks near it.)
    const cx = flow.vw * 1.25; // peak ≈ 87.5% of the width at mid-flight
    const cy = (a.y + b.y) / 2;
    const u = 1 - f;
    const docX = u * u * a.x + 2 * u * f * cx + f * f * b.x; // quadratic Bézier
    const docY = u * u * a.y + 2 * u * f * cy + f * f * b.y;
    // Size changes early in the flight (by 45% of the way), so a big hero-sized packet is already
    // small by the time it passes the caption under its slot.
    const radius = MathUtils.lerp(a.r, b.r, MathUtils.smoothstep(f, 0, 0.45));

    // Spark toy: drag the packet; it springs back with a soft overshoot (damped spring).
    // Fades out as the packet leaves the Spark.
    const atSpark = Math.max(0, 1 - s.route);
    const d = s.drag;
    const tx = (flowInput.spark.x + (tilt.active ? tilt.x * 28 : 0)) * atSpark;
    const ty = (flowInput.spark.y + (tilt.active ? tilt.y * 18 : 0)) * atSpark;
    if (flow.reduced) {
      d.x = tx;
      d.y = ty;
    } else {
      d.vx += ((tx - d.x) * 140 - d.vx * 11) * delta;
      d.vy += ((ty - d.y) * 140 - d.vy * 11) * delta;
      d.x += d.vx * delta;
      d.y += d.vy * delta;
    }

    const bob = flow.reduced ? 0 : Math.sin(frame.clock.elapsedTime * 1.6) * radius * 0.08;
    docToWorld(docX + d.x, docY + d.y + bob, s.v);
    g.position.copy(s.v);
    g.position.z = radius * 0.6; // in front of the station it belongs to
    g.scale.setScalar(radius / BODY_RADIUS);

    if (debugEnabled) {
      const p = s.p.copy(s.v).project(frame.camera);
      const debug = (window.__flowDebug ??= { stations: {} });
      debug.packet = { x: ((p.x + 1) / 2) * frame.size.width, y: ((1 - p.y) / 2) * frame.size.height - flow.pad, r: radius };
    }
  });

  return (
    <group ref={group}>
      <PacketBody calm={flow.reduced} />
      {/* Warm light the packet carries (decay 0: constant strength at pixel-scale distances). */}
      <pointLight color={palette.color.accent} intensity={2.2} distance={0} decay={0} />
    </group>
  );
}
