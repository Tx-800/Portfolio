"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { SRGBColorSpace, TextureLoader, type MeshBasicMaterial, type Texture } from "three";
import { core, morphAt, siteAt } from "@/components/core/timeline";
import { BROWSER } from "@/components/three/core/coreShapes";
import { useScene } from "@/components/three/SceneContext";
import { projectsInChapter } from "@/data/content";

const SCREEN = { w: BROWSER.w - 0.08, h: BROWSER.h - BROWSER.bar - 0.06 };

/**
 * The website's screenshot inside the browser-shaped Core, when a screenshot exists in
 * /public (the server passes only files that exist). Without screenshots this renders nothing
 * and the particles' content bars stand in for the page.
 */
export function SiteScreen() {
  const { screenshots } = useScene();
  const projects = useMemo(() => projectsInChapter("websites"), []);
  const material = useRef<MeshBasicMaterial>(null);
  const [textures, setTextures] = useState<(Texture | null)[]>([]);

  useEffect(() => {
    const loaded: Texture[] = [];
    projects.forEach((project, i) => {
      const src = screenshots[project.slug];
      if (!src) return;
      new TextureLoader().load(src, (texture) => {
        texture.colorSpace = SRGBColorSpace;
        loaded.push(texture);
        setTextures((list) => Object.assign([...list], { [i]: texture }));
      });
    });
    return () => loaded.forEach((t) => t.dispose());
  }, [projects, screenshots]);

  useFrame(() => {
    const m = material.current;
    if (!m) return;
    const t = core.t;
    // Visible only while the Core is (almost) the browser; crossfades through black between sites.
    const shape = 1 - Math.min(Math.abs(morphAt(t) - 1) * 4, 1);
    const site = siteAt(t);
    const index = Math.round(site);
    const between = 1 - Math.abs(site - index) * 2;
    const texture = textures[index] ?? null;
    if (m.map !== texture) {
      m.map = texture;
      m.needsUpdate = true;
    }
    m.opacity = texture ? shape * between * 0.92 : 0;
  });

  if (!textures.some(Boolean)) return null;
  return (
    <mesh position={[0, -BROWSER.bar / 2, -0.01]}>
      <planeGeometry args={[SCREEN.w, SCREEN.h]} />
      <meshBasicMaterial ref={material} transparent opacity={0} toneMapped={false} />
    </mesh>
  );
}
