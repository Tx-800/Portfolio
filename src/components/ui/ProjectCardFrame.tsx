"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useFinePointer } from "@/hooks/useFinePointer";
import { useStageMode } from "@/lib/stageMode";
import { cn } from "@/lib/utils";

/** Max tilt in degrees. */
const TILT = 6;
const SPRING = { stiffness: 260, damping: 30, mass: 0.6 };

interface ProjectCardFrameProps {
  slug: string;
  /**
   * Which layout this copy of the card belongs to. On phones the desktop grid is hidden and a
   * carousel/stack shows the "stage" copies; only the copy for the current mode gets the shared
   * layoutId, so the overlay always morphs out of the card the visitor actually tapped.
   */
  variant?: "desk" | "stage";
  className?: string;
  children: ReactNode;
}

/**
 * Interactive shell of a project card:
 *  - layoutId `case-<slug>` is shared with the case-study overlay, so the card morphs into it
 *  - spring tilt towards the pointer + a soft glare (mouse/trackpad only, never with reduced motion)
 *  - data-cursor="open" makes the custom cursor say "Open"
 */
export function ProjectCardFrame({ slug, variant = "desk", className, children }: ProjectCardFrameProps) {
  const enabled = useFinePointer();
  const stageMode = useStageMode();
  const ownsMorph = (variant === "stage") === stageMode;
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(360px circle at ${glareX}% ${glareY}%, color-mix(in oklab, var(--color-accent) 16%, transparent), transparent 65%)`;

  function move(e: PointerEvent<HTMLElement>) {
    if (!enabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0 … 1
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 2 * TILT);
    rotateX.set(-(py - 0.5) * 2 * TILT);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }

  function reset() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.article
      layoutId={ownsMorph ? `case-${slug}` : undefined}
      data-card={ownsMorph ? slug : undefined}
      data-cursor="open"
      onPointerMove={move}
      onPointerLeave={reset}
      // borderRadius in style lets motion keep the corners round while morphing.
      style={{ rotateX, rotateY, transformPerspective: 1000, borderRadius: 28 }}
      className={cn("card group relative flex h-full flex-col p-6 sm:p-7", className)}
    >
      {enabled && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glare }}
        />
      )}
      {children}
    </motion.article>
  );
}
