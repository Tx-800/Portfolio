"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// Loaded only when requested, so three.js never ships in the normal page bundle from here.
const JourneyDebug = dynamic(() => import("@/components/ui/JourneyDebug").then((m) => m.JourneyDebug), {
  ssr: false,
});

const noop = () => () => {};

/** Shows the scroll-engine debug map when the URL has `?debug`. */
export function DebugLoader() {
  const enabled = useSyncExternalStore(
    noop,
    () => new URLSearchParams(window.location.search).has("debug"),
    () => false,
  );
  return enabled ? <JourneyDebug /> : null;
}
