"use client";

import { Bloom, EffectComposer, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Desktop-only postprocessing.
 *  - Bloom with a high threshold: only emissive accents pushed above 1.0 (the packet, rings,
 *    glowing edges, lit screens) bloom; panels and text-like surfaces stay crisp.
 *  - ToneMapping: EffectComposer switches the renderer's tone mapping off, so ACES is applied
 *    here, after bloom, to match the look of the low tier.
 *  - A soft vignette pulls the eye to the centre.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.9} radius={0.75} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.55} />
    </EffectComposer>
  );
}
