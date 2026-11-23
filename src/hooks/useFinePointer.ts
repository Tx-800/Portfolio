import { useSyncExternalStore } from "react";

const QUERY = "(pointer: fine) and (prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * True for a mouse/trackpad with motion allowed: the condition for pointer-driven delights
 * (custom cursor, magnetic buttons, card tilt). False on touch, with reduced motion, and on the server.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
