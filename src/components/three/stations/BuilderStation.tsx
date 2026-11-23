"use client";

import { type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { IcosahedronGeometry, MathUtils, Vector3, type Group, type Sprite } from "three";
import { Glow } from "@/components/three/Glow";
import { Label } from "@/components/three/Label";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";
import { skillGroups } from "@/data/content";
import { uiStore } from "@/store/ui";

const INDEX = stationIndex("builder");
const RADIUS = 2.6;
/** Idle spin (rad/s) and how quickly a flick of the drag slows down. */
const AUTO_SPIN = 0.18;
const FRICTION = 2.2;
/** Drag sensitivity: radians per pixel. */
const DRAG = 0.006;

/** Even points on a sphere (golden-angle spiral). */
function fibonacciSphere(n: number, r: number): Vector3[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const a = i * golden;
    return new Vector3(Math.cos(a) * ring * r, y * r * 0.8, Math.sin(a) * ring * r);
  });
}

/**
 * 08 — The Builder. Every skill from content.ts floats on a sphere around a glowing wireframe
 * core; the packet orbits it (path.ts `orbit`). Drag to spin it (mouse, or a horizontal swipe
 * on touch); it keeps turning with inertia and settles back into a slow idle spin.
 */
export function BuilderStation() {
  const { palette, glow } = useScene();
  const sphere = useRef<Group>(null);
  const core = useRef<Group>(null);
  const labels = useRef<(Sprite | null)[]>([]);
  const drag = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const scratch = useRef({ rotated: new Vector3(), dragged: 0 });
  const scrub = useRef({ value: 0 });

  const skills = useMemo(() => {
    const tones = [palette.css.gold, palette.css.accent, palette.css["accent-2"], palette.css.heading];
    return skillGroups.flatMap((group, g) => group.skills.map((skill) => ({ name: skill.name, color: tones[g % tones.length] })));
  }, [palette]);
  const points = useMemo(() => fibonacciSphere(skills.length, RADIUS), [skills.length]);

  const wire = useMemo(() => new IcosahedronGeometry(1.1, 1), []);
  useEffect(() => () => wire.dispose(), [wire]);

  // Drag tracking on window, so the drag continues even when the pointer leaves the sphere.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.vx = (e.clientX - d.lastX) * DRAG * 60;
      d.vy = (e.clientY - d.lastY) * DRAG * 60;
      d.lastX = e.clientX;
      d.lastY = e.clientY;
    };
    const end = () => {
      drag.current.active = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end); // e.g. the browser took over a touch to scroll
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    drag.current = { active: true, lastX: e.nativeEvent.clientX, lastY: e.nativeEvent.clientY, vx: 0, vy: 0 };
    document.body.style.cursor = "grabbing";
  };

  const ref = useStationFrame(INDEX, (_, delta) => {
    const d = drag.current;
    const group = sphere.current;
    if (!group) return;
    // Velocity (rad/s) from the drag; decays with friction once released, then idle spin takes over.
    if (!d.active) {
      d.vx = MathUtils.damp(d.vx, 0, FRICTION, delta);
      d.vy = MathUtils.damp(d.vy, 0, FRICTION, delta);
    }
    const sp = scrubbed(INDEX, scrub.current, delta);
    if (sp !== null) {
      // Mobile stage: the sphere turns with the scroll; a swipe still adds its own spin.
      scratch.current.dragged += d.vx * delta;
      group.rotation.y = sp * Math.PI * 1.6 + scratch.current.dragged;
    } else {
      group.rotation.y += (AUTO_SPIN + d.vx) * delta;
    }
    group.rotation.x = MathUtils.clamp(group.rotation.x + d.vy * delta, -0.6, 0.6);
    group.rotation.x = MathUtils.damp(group.rotation.x, 0, d.active ? 0 : 0.8, delta);

    if (core.current) {
      core.current.rotation.y -= delta * 0.3;
      core.current.rotation.z += delta * 0.15;
    }

    // Labels behind the core fade back, so the front ones stay readable. Rotating each label's
    // resting position by the sphere's rotation gives its current depth (+z = towards the viewer).
    const { rotated } = scratch.current;
    labels.current.forEach((label, i) => {
      if (!label) return;
      rotated.copy(points[i]).applyEuler(group.rotation);
      const front = (rotated.z / RADIUS + 1) / 2; // 0 back … 1 front
      label.material.opacity = 0.18 + front * 0.82;
    });
  });

  return (
    <Station ref={ref} id="builder">
      {/* Wireframe core. */}
      <group ref={core}>
        <lineSegments>
          <edgesGeometry args={[wire]} />
          <lineBasicMaterial color={palette.color.gold.clone().multiplyScalar(glow * 0.9)} transparent opacity={0.8} toneMapped={false} />
        </lineSegments>
        <mesh>
          <icosahedronGeometry args={[0.55, 2]} />
          <meshStandardMaterial color={palette.color.surface} emissive={palette.color["accent-2"]} emissiveIntensity={0.6 * glow} toneMapped={false} />
        </mesh>
      </group>
      <Glow color={palette.color.accent} size={6} opacity={0.22} />

      {/* Skill labels on a sphere. */}
      <group ref={sphere}>
        {skills.map((skill, i) => (
          <Label
            key={skill.name}
            ref={(s) => {
              labels.current[i] = s;
            }}
            text={skill.name}
            color={skill.color}
            font="sans"
            height={0.3}
            position={points[i].toArray()}
          />
        ))}
      </group>

      {/* Invisible grab handle covering the sphere. */}
      <mesh
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          if (!drag.current.active) document.body.style.cursor = "grab";
          uiStore.setState({ cursorHint: "drag" }); // custom cursor shows "Drag"
        }}
        onPointerOut={() => {
          if (!drag.current.active) document.body.style.cursor = "";
          uiStore.setState({ cursorHint: null });
        }}
      >
        <sphereGeometry args={[RADIUS + 0.4, 24, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>
    </Station>
  );
}
