"use client";

import { useEffect, useMemo, type Ref } from "react";
import type { Sprite } from "three";
import { createLabelTexture } from "@/components/three/textures";

interface LabelProps {
  ref?: Ref<Sprite>;
  text: string;
  /** CSS colour of the text. */
  color: string;
  /** Height in world units; width follows the text. */
  height?: number;
  position?: [number, number, number];
  opacity?: number;
  pill?: { fill: string; border: string };
  font?: "mono" | "sans";
}

/** Camera-facing text sprite. Decorative only; the scene is aria-hidden and the HTML carries the words. */
export function Label({ ref, text, color, height = 0.32, position, opacity = 1, pill, font }: LabelProps) {
  const { texture, aspect } = useMemo(
    () => createLabelTexture(text, color, { pill, font }),
    // The pill object is recreated on every render; compare its colours instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, color, font, pill?.fill, pill?.border],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <sprite ref={ref} position={position} scale={[height * aspect, height, 1]}>
      <spriteMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </sprite>
  );
}
