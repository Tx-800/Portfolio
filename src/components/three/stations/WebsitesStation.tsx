"use client";

import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, SRGBColorSpace, TextureLoader, type Group, type MeshBasicMaterial, type Texture } from "three";
import { Glow } from "@/components/three/Glow";
import { stationIndex } from "@/components/three/path";
import { scrubbed, useStationFrame } from "@/components/three/rig";
import { useScene } from "@/components/three/SceneContext";
import { Station } from "@/components/three/stations/Station";
import { createScreenTexture } from "@/components/three/textures";
import { projectsInChapter } from "@/data/content";
import { stageInput } from "@/store/journey";

const INDEX = stationIndex("websites");
const RADIUS = 5.6;
/** Panel layout on a gentle arc: angle around the arc + vertical stagger. */
const SLOTS = [
  { angle: -0.5, y: 0.3 },
  { angle: 0, y: -0.1 },
  { angle: 0.5, y: 0.4 },
];
const PANEL = { w: 3.4, h: 2.25, depth: 0.1 };
const SCREEN = { w: 3.24, h: 1.9 };

/**
 * 02 — Where Data Is Born. Three floating browser windows on an arc, one per website project,
 * each showing that site as a texture. They tilt towards the cursor and bob gently.
 */
export function WebsitesStation() {
  const { palette, glow, tier } = useScene();
  const projects = useMemo(() => projectsInChapter("websites"), []);
  const panels = useRef<(Group | null)[]>([]);
  const arc = useRef<Group>(null);
  const scrub = useRef({ value: 0 });

  // One screen texture per project (placeholders until real screenshots are added).
  const textures = useMemo(
    () => projects.map((p, i) => createScreenTexture(p.title, p.context, palette, i)),
    [projects, palette],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  // Real screenshots: the server passes only files that actually exist (lib/media.ts), so a
  // missing screenshot keeps the stylised preview and never triggers a 404.
  const { screenshots } = useScene();
  const screens = useRef<(MeshBasicMaterial | null)[]>([]);
  useEffect(() => {
    const loader = new TextureLoader();
    const loaded: Texture[] = [];
    projects.forEach((project, i) => {
      const src = screenshots[project.slug];
      if (!src) return;
      loader.load(src, (texture) => {
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 4;
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

  const ref = useStationFrame(INDEX, (state, delta, weight) => {
    const time = state.clock.elapsedTime;
    const p = scrubbed(INDEX, scrub.current, delta);
    // Mobile stage: the windows fan out along the arc as the scene is scrubbed, and the arc
    // turns so the window of the card centred in the carousel faces the viewer and comes forward.
    const spread = p === null ? 1 : MathUtils.smoothstep(p, 0, 0.45);
    const active = p === null ? -1 : stageInput.websitesActive;
    if (arc.current) {
      const target = active >= 0 ? SLOTS[active].angle * spread : 0;
      arc.current.rotation.y = MathUtils.damp(arc.current.rotation.y, -target, 5, delta);
    }

    panels.current.forEach((panel, i) => {
      if (!panel) return;
      const slot = SLOTS[i];
      const angle = slot.angle * spread;
      panel.position.x = Math.sin(angle) * RADIUS;
      panel.position.z = -RADIUS * (1 - Math.cos(angle)) + (i === active ? 1.3 : 0) * spread;
      panel.scale.setScalar(MathUtils.damp(panel.scale.x, i === active || active < 0 ? 1 : 0.86, 6, delta));
      // Tilt towards the pointer (only while we're here), plus a slow individual bob.
      const tiltY = -angle + state.pointer.x * 0.22 * weight;
      const tiltX = -state.pointer.y * 0.14 * weight;
      panel.rotation.y = MathUtils.damp(panel.rotation.y, tiltY, 3, delta);
      panel.rotation.x = MathUtils.damp(panel.rotation.x, tiltX, 3, delta);
      panel.position.y = slot.y + Math.sin(time * 0.6 + i * 1.7) * 0.12;
    });
  });

  const dots = [palette.color.gold, palette.color.accent, palette.color["accent-2"]];

  return (
    <Station ref={ref} id="websites">
      {/* The arc pivots around its centre (RADIUS behind the front window) on mobile. */}
      <group ref={arc} position={[0, 0, -RADIUS]}>
      <group position={[0, 0, RADIUS]}>
      {SLOTS.map((slot, i) => (
        <group
          key={projects[i]?.slug ?? i}
          ref={(el) => {
            panels.current[i] = el;
          }}
          position={[Math.sin(slot.angle) * RADIUS, slot.y, -RADIUS * (1 - Math.cos(slot.angle))]}
          rotation={[0, -slot.angle, 0]}
        >
          {/* Soft pink backlight behind each window. */}
          <Glow color={palette.color["accent-2"]} size={5.5} opacity={0.16} position={[0, 0, -0.4]} />

          {/* Window frame. */}
          <RoundedBox args={[PANEL.w, PANEL.h, PANEL.depth]} radius={0.12} smoothness={4}>
            <meshStandardMaterial
              color={palette.color["surface-2"]}
              metalness={tier === "high" ? 0.7 : 0.3}
              roughness={0.32}
            />
          </RoundedBox>

          {/* Traffic-light dots in the title bar: tiny glowing accents. */}
          {dots.map((color, d) => (
            <mesh key={d} position={[-PANEL.w / 2 + 0.22 + d * 0.16, PANEL.h / 2 - 0.15, PANEL.depth / 2 + 0.005]}>
              <circleGeometry args={[0.04, 20]} />
              <meshBasicMaterial color={color.clone().multiplyScalar(glow)} toneMapped={false} />
            </mesh>
          ))}

          {/* The "website" itself. */}
          <mesh position={[0, -0.13, PANEL.depth / 2 + 0.004]}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
            <meshBasicMaterial
              ref={(m) => {
                screens.current[i] = m;
              }}
              map={textures[i]}
              toneMapped={false}
            />
          </mesh>

          {/* Thin glowing edge along the bottom: catches the bloom. */}
          <mesh position={[0, -PANEL.h / 2 + 0.01, PANEL.depth / 2 + 0.006]}>
            <planeGeometry args={[PANEL.w * 0.6, 0.015]} />
            <meshBasicMaterial color={palette.color.accent.clone().multiplyScalar(glow * 1.4)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      </group>
      </group>
    </Station>
  );
}
