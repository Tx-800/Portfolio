import { useSyncExternalStore } from "react";
import { hasWebGL } from "@/lib/webgl";

/**
 * Mobile "pinned stage" mode: phones and small tablets (below 1024px or touch), motion allowed.
 * MUST match the `stage` custom variant in globals.css (which also requires WebGL).
 */
export const STAGE_QUERY =
  "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference), (pointer: coarse) and (prefers-reduced-motion: no-preference)";

export function isStageMode(): boolean {
  return typeof window !== "undefined" && window.matchMedia(STAGE_QUERY).matches && hasWebGL();
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(STAGE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Live stage-mode flag for React components. False on the server. */
export function useStageMode(): boolean {
  return useSyncExternalStore(subscribe, isStageMode, () => false);
}
