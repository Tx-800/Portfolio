"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Vector3, type Points } from "three";
import { getCurves } from "@/components/three/path";
import { useScene } from "@/components/three/SceneContext";
import { getGlowTexture } from "@/components/three/textures";
import { createRandom } from "@/lib/random";

/**
 * Faint particles scattered in a loose tube around the whole journey. Fog fades the far ones,
 * which gives every station depth. One draw call for all particles.
 */
export function DataDust({ count }: { count: number }) {
  const { palette } = useScene();
  const ref = useRef<Points>(null);
  const map = useMemo(() => getGlowTexture(), []);

  const { positions, colors } = useMemo(() => {
    const curve = getCurves().packet;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const p = new Vector3();
    const c = new Color();
    const random = createRandom(7);
    // Mostly quiet plum/muted specks, with a few warm sparks.
    const swatches = [palette.color.muted, palette.color["border-strong"], palette.color.gold, palette.color.accent, palette.color["accent-2"]];
    const weights = [0.45, 0.25, 0.1, 0.1, 0.1];

    for (let i = 0; i < count; i++) {
      curve.getPoint(random(), p);
      const angle = random() * Math.PI * 2;
      const radius = 4 + random() * 14;
      positions.set([p.x + Math.cos(angle) * radius, p.y + Math.sin(angle) * radius * 0.6, p.z + (random() - 0.5) * 10], i * 3);

      let r = random();
      let k = 0;
      while (k < weights.length - 1 && r > weights[k]) r -= weights[k++];
      c.copy(swatches[k]).multiplyScalar(0.6 + random() * 0.6);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    return { positions, colors };
  }, [count, palette]);

  // Very slow drift so the space never feels frozen.
  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(time * 0.08) * 0.4;
    ref.current.rotation.z = Math.sin(time * 0.05) * 0.02;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={map}
        size={0.14}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
