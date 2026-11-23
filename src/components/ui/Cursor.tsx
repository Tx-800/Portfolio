"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { chapters, uiText } from "@/data/content";
import { useFinePointer } from "@/hooks/useFinePointer";
import { cn } from "@/lib/utils";
import { useJourney } from "@/store/journey";
import { useUi } from "@/store/ui";

type Mode = "default" | "link" | "open" | "drag" | "text";

/** What the element under the pointer asks for: data-cursor wins, then links/buttons, then inputs. */
function modeFor(target: EventTarget | null): Mode {
  if (!(target instanceof Element)) return "default";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged?.dataset.cursor === "open") return "open";
  if (target.closest("input, textarea, [contenteditable='true']")) return "text";
  if (target.closest("a, button, [role='button'], label, summary")) return "link";
  return "default";
}

/**
 * Custom cursor (mouse/trackpad only, never with reduced motion): a dot that follows exactly and
 * a ring that trails on a spring. The ring grows over links, shows "Open" over project cards and
 * "Drag" over the 3D skill sphere, and steps aside in text fields.
 */
export function Cursor() {
  const enabled = useFinePointer();
  const hint = useUi((s) => s.cursorHint);
  // Only trust the 3D hint while The Builder is the current chapter (it can go stale otherwise).
  const atBuilder = useJourney((s) => chapters[s.activeIndex]?.id === "builder");
  const [mode, setMode] = useState<Mode>("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 420, damping: 36, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 420, damping: 36, mass: 0.6 });

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: PointerEvent) => setMode(modeFor(e.target));
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    const leave = () => setVisible(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  // The 3D scene can ask for "drag" while nothing in the HTML claims the pointer.
  const active: Mode = mode === "default" && hint === "drag" && atBuilder ? "drag" : mode;
  const label = active === "open" ? uiText.cursor.open : active === "drag" ? uiText.cursor.drag : null;
  const ringSize = label ? 76 : active === "link" ? 56 : 34;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none fixed inset-0 z-[100] transition-opacity duration-200", visible && active !== "text" ? "opacity-100" : "opacity-0")}>
      <motion.div
        className={cn(
          "absolute top-0 left-0 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition-[width,height,background-color,border-color] duration-300 ease-out",
          label ? "border-transparent bg-plasma" : active === "link" ? "border-accent/70 bg-accent/10" : "border-heading/40",
        )}
        style={{ x: ringX, y: ringY, width: ringSize, height: ringSize, scale: pressed ? 0.88 : 1 }}
      >
        {label && <span className="label-mono text-[0.625rem] text-bg">{label}</span>}
      </motion.div>
      <motion.div
        className={cn("absolute top-0 left-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-heading", label && "opacity-0")}
        style={{ x, y }}
      />
    </div>
  );
}
