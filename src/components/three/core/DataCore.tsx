"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, MathUtils, Vector3, type Group, type Points, type ShaderMaterial } from "three";
import { core, effectsAt, morphAt, siteAt, WORLD_PER_LEG } from "@/components/core/timeline";
import { createCoreShapes, ENVELOPE, SHAPE_NAMES } from "@/components/three/core/coreShapes";
import { SiteScreen } from "@/components/three/core/SiteScreen";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";

/** ~10k particles on phones (one draw call). */
const COUNT = 10000;
/** Particle size in world units (the shader converts to pixels by distance). */
const POINT_SIZE = 0.032;
/** Colour nudge per shape (moves the gradient towards gold < 0 < pink). */
const SHIFT = [0, 0.22, -0.12, 0.06, -0.05, 0.2, -0.16, 0.04, 0.16];

/**
 * THE MORPH (vertex shader)
 * -------------------------
 * The GPU only ever sees TWO shapes: aFrom and aTo (plus their meta values), and f, how far the
 * Core is between them. When scrolling crosses into another pair of shapes (another chapter),
 * the CPU copies that pair into the two buffers once (see useFrame below). Per particle:
 *   1. effects: each side gets its shape's own effect (fx): screens lighting up, the cube's
 *      refresh layer, a table going stale, cluster focus, QAgent's report, many → one, the flap closing…
 *   2. stagger: each particle starts its trip a little later (aRandom.w), so a shape dissolves
 *      and re-forms in waves instead of all at once;
 *   3. in-between drama: sin(π·f) is 0 at both shapes and 1 halfway, so particles BURST outward
 *      along their own random direction and SWIRL around the view axis, then settle;
 *   4. idle life: a slow breathing scale and a tiny per-particle shimmer.
 * Everything is a function of scroll (uniforms come from effectsAt(t)), so scrolling back plays
 * it all backwards.
 */
const vertexShader = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aMetaFrom;
  attribute float aMetaTo;
  attribute vec4 aRandom;
  attribute float aTone;
  uniform float uFromShape;
  uniform float uToShape;
  uniform float uF;
  uniform float uSite;
  uniform float uLit;
  uniform float uSweep;
  uniform float uStale;
  uniform float uEnvelope;
  uniform float uFocus;
  uniform float uReport;
  uniform float uCollapse;
  uniform float uFlap;
  uniform float uTime;
  uniform float uShift;
  uniform float uSize;
  uniform float uFocal;
  uniform vec3 uGold;
  uniform vec3 uOrange;
  uniform vec3 uPink;
  uniform vec3 uStaleColor;
  varying vec3 vColor;

  float ease(float x) { return x * x * (3.0 - 2.0 * x); }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  // One shape's effect on a particle: may move it (p), tint it (col), dim/brighten it (bright).
  void fx(float shape, float meta, inout vec3 p, inout vec3 col, inout float bright) {
    if (shape < 0.5) {
      // orb: as modelled
    } else if (shape < 1.5) {
      // browser: a small ripple while switching from one website to the next
      p += aRandom.xyz * sin(3.14159 * fract(uSite)) * 0.2;
    } else if (shape < 2.5) {
      // grid: dim until uLit passes this particle's screen
      bright *= mix(0.2, 1.4, clamp(uLit - meta, 0.0, 1.0));
    } else if (shape < 3.5) {
      // cube: a bright refresh layer sweeps from the bottom (meta 0) to the top (meta 1)
      float band = exp(-pow((meta - uSweep * 1.2 + 0.1) * 8.0, 2.0));
      bright *= 0.55 + 1.7 * band;
      col = mix(col, uGold, band * 0.6);
    } else if (shape < 4.5) {
      // scanning ring: a beam sweeps round; one table turns stale; the envelope flies out
      float a = atan(p.y, p.x) - uTime * 1.3;
      float d = abs(mod(a + 3.14159, 6.28318) - 3.14159);
      bright *= 0.55 + 1.3 * exp(-d * d * 5.0);
      // (dimmed as it turns blue: dense additive points would otherwise wash out to white)
      if (meta > 0.5 && meta < 1.5) {
        col = mix(col, uStaleColor, uStale);
        bright *= mix(1.0, 0.6, uStale);
      }
      if (meta > 1.5) {
        col = mix(col, uStaleColor, uStale * 0.6);
        p += vec3(1.6, 1.25, 0.8) * uEnvelope * uEnvelope;
        bright *= 1.6 * (1.0 - smoothstep(0.7, 1.0, uEnvelope));
      }
    } else if (shape < 5.5) {
      // QAgent, scrubbed by uReport: the test report flies in from the left (meta 3), its check
      // marks light up one by one (4.0 / 4.1 / 4.2; the middle one is a "fail"), then the reply
      // envelope (5) flies out. Only visible while the QAgent cluster is in focus.
      float qagent = clamp(-uFocus, 0.0, 1.0);
      float arrive = ease(clamp(uReport / 0.3, 0.0, 1.0));
      float reply = clamp((uReport - 0.62) / 0.38, 0.0, 1.0);
      if (meta < 1.5) {
        // network: the cluster in focus glows, the other one dims (meta: 0 QAgent, 1 Compliance, .5 bridge)
        float side = meta * 2.0 - 1.0;
        float match = 1.0 - abs(side - uFocus) * 0.5;
        bright *= mix(0.22, 1.5, match);
        // The QAgent cluster steps back while its report sits in front of it, so the page reads.
        if (meta < 0.25) bright *= 1.0 - 0.9 * arrive * qagent * (1.0 - reply);
      } else {
        if (meta < 3.5) {
          p.x -= (1.0 - arrive) * 2.4;
          bright *= arrive * qagent * 1.1;
        } else if (meta < 4.5) {
          float row = floor((meta - 4.0) * 10.0 + 0.5);
          float on = smoothstep(0.3 + row * 0.09, 0.36 + row * 0.09, uReport);
          col = row == 1.0 ? uPink : uGold;
          bright *= mix(0.0, 2.4, on) * qagent;
        } else {
          p += vec3(-1.5, 1.15, 0.8) * reply * reply;
          bright *= step(0.001, reply) * (1.0 - smoothstep(0.75, 1.0, reply)) * 1.8;
        }
      }
    } else if (shape < 6.5) {
      // many → one: the people (+ the developer, tinted) and their back-and-forth lines pull into
      // the centre and fade, while the one email grows out of it (meta 0 / .5 / 1 → 2)
      if (meta < 1.5) {
        // (squared fade: many points squeezed into the centre would otherwise add up to a blob)
        p.xy *= mix(1.0, 0.3, uCollapse);
        bright *= (1.0 - uCollapse) * (1.0 - uCollapse);
        if (meta > 0.25 && meta < 0.75) col = mix(col, uPink, 0.75);
        if (meta > 0.75) bright *= 0.45;
      } else {
        p.xy *= mix(0.15, 1.0, uCollapse);
        bright *= 1.7 * uCollapse;
      }
    } else if (shape < 7.5) {
      // globe: spins; skill dots shine
      vec2 xz = rot(uTime * 0.25) * p.xz;
      p.x = xz.x;
      p.z = xz.y;
      bright *= meta > 0.5 ? 1.9 : 0.65;
    } else {
      // envelope: the flap folds down over the top edge (a rotation about that edge, towards
      // the viewer) and the seal lights up as it closes
      if (meta > 0.5 && meta < 1.5) {
        float top = ${(ENVELOPE.cy + ENVELOPE.h / 2).toFixed(3)};
        float dy = p.y - top;
        float a = uFlap * 3.14159;
        p.y = top + dy * cos(a);
        p.z += dy * sin(a) * 0.5;
      }
      if (meta > 1.5) bright *= mix(0.1, 2.6, uFlap);
    }
  }

  void main() {
    float tone = clamp(aTone + uShift, 0.0, 1.0);
    vec3 base = tone < 0.5 ? mix(uGold, uOrange, tone * 2.0) : mix(uOrange, uPink, (tone - 0.5) * 2.0);

    // 1. Each side with its own effect.
    vec3 pA = aFrom;
    vec3 cA = base;
    float bA = 1.0;
    fx(uFromShape, aMetaFrom, pA, cA, bA);
    vec3 pB = aTo;
    vec3 cB = base;
    float bB = 1.0;
    fx(uToShape, aMetaTo, pB, cB, bB);

    // 2. Staggered travel between them.
    float k = ease(clamp((uF - aRandom.w * 0.35) / 0.65, 0.0, 1.0));
    vec3 p = mix(pA, pB, k);
    // 3. Burst + swirl, strongest halfway.
    float burst = sin(3.14159 * uF);
    p += aRandom.xyz * burst * 0.9;
    p.xy = rot(burst * (1.4 + aRandom.w)) * p.xy;
    // 4. Breathing + shimmer.
    p *= 1.0 + 0.025 * sin(uTime * 1.6);
    p += aRandom.xyz * 0.012 * sin(uTime * 2.0 + aRandom.w * 40.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uFocal / -mv.z;
    vColor = mix(cA * bA, cB * bB, k);
  }
`;

// Soft round dot; additive blending makes dense areas glow.
const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, a * 0.9);
    #include <colorspace_fragment>
  }
`;

/**
 * The hero of the mobile journey: a particle Core that is always centred in front of the
 * camera (it flies with the viewer), morphs at every gate, breathes, and turns when dragged.
 */
export function DataCore() {
  const { palette } = useScene();
  const group = useRef<Group>(null);
  const material = useRef<ShaderMaterial>(null);
  const points = useRef<Points>(null);
  const state = useRef({ y: 0, vy: 0, x: 0, vx: 0, centre: new Vector3(), pair: -1 });

  const { geometry, shapes } = useMemo(() => {
    const shapes = createCoreShapes(COUNT);
    const g = new BufferGeometry();
    // `position` is required by three.js; the shader uses aFrom/aTo instead.
    g.setAttribute("position", new BufferAttribute(shapes.positions[0], 3));
    g.setAttribute("aFrom", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aTo", new BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aMetaFrom", new BufferAttribute(new Float32Array(COUNT), 1));
    g.setAttribute("aMetaTo", new BufferAttribute(new Float32Array(COUNT), 1));
    g.setAttribute("aRandom", new BufferAttribute(shapes.random, 4));
    g.setAttribute("aTone", new BufferAttribute(shapes.tone, 1));
    return { geometry: g, shapes };
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uFromShape: { value: 0 },
      uToShape: { value: 1 },
      uF: { value: 0 },
      uSite: { value: 0 },
      uLit: { value: 0 },
      uSweep: { value: 0 },
      uStale: { value: 0 },
      uEnvelope: { value: 0 },
      uFocus: { value: -1 },
      uReport: { value: 0 },
      uCollapse: { value: 0 },
      uFlap: { value: 0 },
      uTime: { value: 0 },
      uShift: { value: 0 },
      uSize: { value: POINT_SIZE },
      uFocal: { value: 1000 },
      uGold: { value: palette.color.gold },
      uOrange: { value: palette.color.accent },
      uPink: { value: palette.color["accent-2"] },
      uStaleColor: { value: palette.color.stale },
    }),
    [palette],
  );

  useFrame((frame, rawDelta) => {
    const g = group.current;
    const u = material.current?.uniforms;
    const geo = points.current?.geometry;
    if (!g || !u || !geo) return;
    const delta = Math.min(rawDelta, 0.1);
    const t = core.t;
    const morph = morphAt(t);
    const s = state.current;

    // Which pair of shapes are we between? Upload that pair only when it changes.
    const last = SHAPE_NAMES.length - 1;
    const pair = Math.min(Math.floor(morph), last - 1);
    if (pair !== s.pair) {
      s.pair = pair;
      const attr = geo.attributes;
      (attr.aFrom.array as Float32Array).set(shapes.positions[pair]);
      (attr.aTo.array as Float32Array).set(shapes.positions[pair + 1]);
      (attr.aMetaFrom.array as Float32Array).set(shapes.meta[pair]);
      (attr.aMetaTo.array as Float32Array).set(shapes.meta[pair + 1]);
      attr.aFrom.needsUpdate = attr.aTo.needsUpdate = attr.aMetaFrom.needsUpdate = attr.aMetaTo.needsUpdate = true;
      u.uFromShape.value = pair;
      u.uToShape.value = pair + 1;
    }
    const f = Math.min(morph - pair, 1);
    u.uF.value = f;

    // Effects, all scrubbed by scroll. A tapped agent cluster wins over the scroll's focus
    // (and is forgotten once the Core is no longer the network).
    const fx = effectsAt(t);
    if (Math.abs(morph - 5) > 0.5) core.focusOverride = null;
    u.uSite.value = siteAt(t);
    u.uLit.value = fx.lit;
    u.uSweep.value = fx.sweep;
    u.uStale.value = fx.stale;
    u.uEnvelope.value = fx.envelope;
    u.uFocus.value = MathUtils.damp(u.uFocus.value, core.focusOverride ?? fx.focus, 6, delta);
    u.uReport.value = fx.report;
    u.uCollapse.value = fx.collapse;
    u.uFlap.value = fx.flap;
    u.uTime.value = frame.clock.elapsedTime;
    u.uShift.value = MathUtils.lerp(SHIFT[pair], SHIFT[pair + 1], f);
    u.uFocal.value = core.focalPx * frame.gl.getPixelRatio();

    // Always the same distance in front of the camera, on its axis: the Core flies with you.
    g.position.set(0, 0, -core.s * WORLD_PER_LEG - core.coreDist);

    // Touch: a damped spring towards the finger's target (0 when released → swings back with
    // a little overshoot). The orb also sways slowly on its own, so its rings catch the light.
    s.vy += ((core.drag.x - s.y) * 70 - s.vy * 9) * delta;
    s.vx += ((core.drag.y - s.x) * 70 - s.vx * 9) * delta;
    s.y += s.vy * delta;
    s.x += s.vx * delta;
    const orb = 1 - Math.min(morph, 1);
    g.rotation.y = s.y + Math.sin(frame.clock.elapsedTime * 0.25) * 0.5 * orb;
    g.rotation.x = s.x + 0.12 * orb;

    // Where the Core's centre lands on screen (checked by the screenshot script).
    s.centre.copy(g.position).project(frame.camera);
    core.projected.x = ((s.centre.x + 1) / 2) * frame.size.width;
    core.projected.y = ((1 - s.centre.y) / 2) * frame.size.height;
  });

  return (
    <group ref={group}>
      <Glow color={palette.color.accent} size={3.6} opacity={0.32} />
      <Glow color={palette.color["accent-2"]} size={7} opacity={0.1} />
      <points ref={points} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      <SiteScreen />
    </group>
  );
}
