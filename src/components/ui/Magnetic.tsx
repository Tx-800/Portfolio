"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";

/** How far (as a fraction of the pointer's offset from the centre) the element follows. */
const STRENGTH = 0.28;

/**
 * Magnetic wrapper for primary CTAs: the element leans towards the pointer and springs back on
 * leave. Mouse/trackpad only; renders its children untouched on touch or with reduced motion.
 */
export function Magnetic({ children }: { children: ReactNode }) {
  const enabled = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.5 });

  if (!enabled) return <>{children}</>;

  function move(e: PointerEvent<HTMLSpanElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * STRENGTH);
    y.set((e.clientY - (rect.top + rect.height / 2)) * STRENGTH);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span className="inline-flex" style={{ x: sx, y: sy }} onPointerMove={move} onPointerLeave={reset}>
      {children}
    </motion.span>
  );
}
