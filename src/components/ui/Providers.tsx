"use client";

import { MotionConfig } from "motion/react";

/**
 * reducedMotion="user": with prefers-reduced-motion, motion skips transform and layout
 * animations (cards, overlays, terminal) and keeps only opacity fades.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
