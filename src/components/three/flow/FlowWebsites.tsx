"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, SRGBColorSpace, TextureLoader, type Group, type MeshBasicMaterial, type Texture } from "three";
import { Anchored } from "@/components/three/flow/Anchored";
import { flow } from "@/components/three/flow/sync";
import { Glow } from "@/components/three/Glow";
import { useScene } from "@/components/three/SceneContext";
import { createScreenTexture } from "@/components/three/textures";
import { projectsInChapter } from "@/data/content";
import { flowInput } from "@/store/flow";

const PANEL = { w: 6.4, h: 4.2, depth: 0.16 };
const SCREEN = { w: 6.1, h: 3.55 };
/** Horizontal spacing between windows, in station units (10 = slot width). */
const SPACING = 7.4;

/**
 * 02 — Where Data Is Born (flow). Three browser windows in a row. The HTML carousel over this
 * slot (WebsitesStrip, native scroll-snap) writes a continuous position 0…2; the windows follow
 * it: the centred one comes forward and faces you, its neighbours turn inwards and recede.
 */
export function FlowWebsites() {
  const { palette, glow, tier, screenshots } = useScene();
  const projects = useMemo(() => projectsInChapter("websites"), []);
  const windows = useRef<(Group | null)[]>([]);
  const screens = useRef<(MeshBasicMaterial | null)[]>([]);
  const offset = useRef(0);

  const textures = useMemo(() => projects.map((p, i) => createScreenTexture(p.title, p.context, palette, i)), [projects, palette]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  // Real screenshots (only files that exist, resolved on the server) replace the previews.
  useEffect(() => {
    const loaded: Texture[] = [];
    projects.forEach((project, i) => {
      const src = screenshots[project.slug];
      if (!src) return;
      new TextureLoader().load(src, (texture) => {
        texture.colorSpace = SRGBColorSpace;
        loaded.push(texture);
        const material = screens.current[i];
        if (material) {
          material.map = texture;
          material.needsUpdate = true;
        }
      });
    });
    return () => loaded.forEach((t) => t.dispose());
  }, [projects, screenshots]);

  const dots = [palette.color.gold, palette.color.accent, palette.color["accent-2"]];

  return (
    <Anchored
      id="websites"
      onFrame={(state, delta, { settle }) => {
        // Follow the carousel with a little inertia (instant with reduced motion).
        offset.current = flow.reduced ? flowInput.websites.offset : MathUtils.damp(offset.current, flowInput.websites.offset, 9, delta);
        windows.current.forEach((win, i) => {
          if (!win) return;
          const d = i - offset.current; // 0 = centred
          const ad = Math.min(Math.abs(d), 1.4);
          win.position.set(d * SPACING * (0.7 + 0.3 * settle), 0.7 + (flow.reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + i) * 0.08), -ad * 3.2);
          win.rotation.y = -d * 0.42;
          win.scale.setScalar(1 - ad * 0.16);
        });
      }}
    >
      {projects.map((project, i) => (
        <group
          key={project.slug}
          ref={(el) => {
            windows.current[i] = el;
          }}
        >
          <Glow color={palette.color["accent-2"]} size={10} opacity={0.14} position={[0, 0, -0.5]} />
          <RoundedBox args={[PANEL.w, PANEL.h, PANEL.depth]} radius={0.18} smoothness={4}>
            <meshStandardMaterial color={palette.color["surface-2"]} metalness={tier === "high" ? 0.7 : 0.35} roughness={0.32} />
          </RoundedBox>
          {dots.map((color, d) => (
            <mesh key={d} position={[-PANEL.w / 2 + 0.38 + d * 0.28, PANEL.h / 2 - 0.26, PANEL.depth / 2 + 0.005]}>
              <circleGeometry args={[0.07, 20]} />
              <meshBasicMaterial color={color.clone().multiplyScalar(glow)} toneMapped={false} />
            </mesh>
          ))}
          <mesh position={[0, -0.2, PANEL.depth / 2 + 0.004]}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
            <meshBasicMaterial
              ref={(m) => {
                screens.current[i] = m;
              }}
              map={textures[i]}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, -PANEL.h / 2 + 0.02, PANEL.depth / 2 + 0.006]}>
            <planeGeometry args={[PANEL.w * 0.6, 0.03]} />
            <meshBasicMaterial color={palette.color.accent.clone().multiplyScalar(glow * 1.4)} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </Anchored>
  );
}
