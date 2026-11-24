"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type ShaderMaterial } from "three";
import { CHAPTERS, core, morphAt, WORLD_PER_LEG } from "@/components/core/timeline";
import { accentOf } from "@/components/three/core/accents";
import { useScene } from "@/components/three/SceneContext";

/** The tunnel repeats every LOOP world units (fixed points in space, wrapped around the camera). */
const LOOP = 90;
const STREAKS = 420;
const RIB_SPACING = 9;

/**
 * THE FLY-THROUGH (vertex shader, no per-frame CPU work)
 * ------------------------------------------------------
 * Streaks and ribs are fixed points in a slab of space LOOP units deep that repeats forever.
 * Each frame we only pass the camera's travelled distance (uCam). For every vertex:
 *     ahead = mod(z0 − uCam, LOOP)   → how far in front of the camera it is (0..LOOP)
 * so as the camera moves forward, everything slides towards and past it, and whatever goes
 * behind reappears far ahead. A streak's second vertex (aEnd = 1) sits uStretch further ahead,
 * and uStretch grows with the scroll speed: fast scrolling = long light streaks.
 * Fade-in far away and fade-out just before the camera hide the wrap-around.
 */
const vertexShader = /* glsl */ `
  attribute vec3 aBase;
  attribute float aEnd;
  uniform float uCam;
  uniform float uLoop;
  uniform float uStretch;
  varying float vFade;
  void main() {
    float ahead = mod(aBase.z - uCam, uLoop) + aEnd * uStretch;
    vec3 world = vec3(aBase.xy, -uCam - ahead);
    vFade = smoothstep(uLoop, uLoop * 0.45, ahead) * smoothstep(0.6, 5.0, ahead);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    gl_FragColor = vec4(uColor, vFade * uOpacity);
    #include <colorspace_fragment>
  }
`;

function makeGeometry(base: number[], end: number[]): BufferGeometry {
  const g = new BufferGeometry();
  const b = new Float32Array(base);
  g.setAttribute("position", new BufferAttribute(b, 3));
  g.setAttribute("aBase", new BufferAttribute(b, 3));
  g.setAttribute("aEnd", new BufferAttribute(new Float32Array(end), 1));
  return g;
}

/**
 * The space you fly through: light streaks on a wide tube around the Core's path, and faint
 * rectangular "ribs" (grid lines) rushing past at the edges of the screen.
 */
export function FlySpace() {
  const { palette } = useScene();
  const streakMat = useRef<ShaderMaterial>(null);
  const ribMat = useRef<ShaderMaterial>(null);

  const { streaks, ribs } = useMemo(() => {
    // Streaks: random points on an annulus (radius 2.4–9) so they never cross the Core.
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const base: number[] = [];
    const end: number[] = [];
    for (let i = 0; i < STREAKS; i++) {
      const a = rand() * Math.PI * 2;
      const r = 2.4 + Math.sqrt(rand()) * 6.6;
      const z = rand() * LOOP;
      base.push(Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * r, Math.sin(a) * r, z);
      end.push(0, 1);
    }
    // Ribs: a portrait rectangle (like the phone's screen) every RIB_SPACING units.
    const ribBase: number[] = [];
    const [w, h] = [3.4, 6.2];
    const corners = [
      [-w, -h],
      [w, -h],
      [w, h],
      [-w, h],
    ];
    for (let z = 0; z < LOOP; z += RIB_SPACING) {
      corners.forEach(([x, y], i) => {
        const [nx, ny] = corners[(i + 1) % 4];
        ribBase.push(x, y, z, nx, ny, z);
      });
    }
    return { streaks: makeGeometry(base, end), ribs: makeGeometry(ribBase, new Array(ribBase.length / 3).fill(0)) };
  }, []);
  useEffect(
    () => () => {
      streaks.dispose();
      ribs.dispose();
    },
    [streaks, ribs],
  );

  const uniforms = useMemo(
    () => ({
      streak: { uCam: { value: 0 }, uLoop: { value: LOOP }, uStretch: { value: 0.2 }, uColor: { value: new Color() }, uOpacity: { value: 0.55 } },
      rib: { uCam: { value: 0 }, uLoop: { value: LOOP }, uStretch: { value: 0 }, uColor: { value: new Color() }, uOpacity: { value: 0.1 } },
    }),
    [],
  );

  useFrame(() => {
    const cam = core.s * WORLD_PER_LEG;
    const m = morphAt(core.t);
    const s = streakMat.current?.uniforms;
    const r = ribMat.current?.uniforms;
    if (!s || !r) return;
    s.uCam.value = cam;
    r.uCam.value = cam;
    // Streak length follows the speed (legs/s → world units), capped.
    s.uStretch.value = 0.15 + Math.min(core.speed * WORLD_PER_LEG * 0.35, 14);
    s.uOpacity.value = 0.35 + Math.min(core.speed * 0.25, 0.4);
    // Tint follows the chapter's accent, blending into the next one through each gate.
    const i = Math.min(Math.floor(m), CHAPTERS.length - 2);
    s.uColor.value.copy(accentOf(palette, CHAPTERS[i])).lerp(accentOf(palette, CHAPTERS[i + 1]), Math.min(m - i, 1));
    r.uColor.value.copy(palette.color.heading);
  });

  return (
    <>
      <lineSegments geometry={streaks} frustumCulled={false}>
        <shaderMaterial ref={streakMat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms.streak} transparent depthWrite={false} blending={AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={ribs} frustumCulled={false}>
        <shaderMaterial ref={ribMat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms.rib} transparent depthWrite={false} blending={AdditiveBlending} />
      </lineSegments>
    </>
  );
}
