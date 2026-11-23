"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { journeyStore } from "@/store/journey";

interface SceneBeatsProps {
  /** Chapter index (into `chapters`): whose scene progress drives the beats. */
  index: number;
  beats: readonly string[];
  className?: string;
}

/**
 * Mobile pinned scene: short text beats that swap as the scene is scrubbed. Beat i is active
 * while progress is in [i/n, (i+1)/n). Updates are DOM attribute writes from a store
 * subscription (only when the active beat changes): no React re-render while scrolling.
 * CSS does the slide/fade. Hidden outside stage mode.
 */
export function SceneBeats({ index, beats, className }: SceneBeatsProps) {
  const list = useRef<HTMLOListElement>(null);
  const dots = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let current = -1;
    const apply = () => {
      const p = journeyStore.getState().sceneP[index];
      const active = Math.min(beats.length - 1, Math.floor(p * beats.length));
      if (active === current) return;
      current = active;
      const state = (i: number) => (i < active ? "past" : i === active ? "active" : "next");
      list.current?.querySelectorAll("li").forEach((li, i) => li.setAttribute("data-state", state(i)));
      dots.current?.querySelectorAll("span").forEach((dot, i) => dot.setAttribute("data-state", state(i)));
    };
    apply();
    return journeyStore.subscribe(apply);
  }, [index, beats.length]);

  return (
    <div className={cn("mt-4 hidden stage:block", className)}>
      <ol ref={list} className="relative h-[3.4rem]">
        {beats.map((beat, i) => (
          <li
            key={beat}
            data-state={i === 0 ? "active" : "next"}
            className={cn(
              "absolute inset-x-0 top-0 text-[1.0625rem] leading-snug font-medium text-heading",
              "transition-[opacity,translate] duration-500 ease-out",
              "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
              "data-[state=next]:translate-y-3 data-[state=next]:opacity-0",
              "data-[state=past]:-translate-y-3 data-[state=past]:opacity-0",
            )}
          >
            {beat}
          </li>
        ))}
      </ol>
      {/* Beat progress: one dot per beat. */}
      <span ref={dots} aria-hidden="true" className="mt-3 flex gap-1.5">
        {beats.map((beat, i) => (
          <span
            key={beat}
            data-state={i === 0 ? "active" : "next"}
            className="h-1 w-4 rounded-full bg-border-strong transition-[background-color,width] duration-500 data-[state=active]:bg-signature data-[state=active]:w-8 data-[state=past]:bg-gold/60"
          />
        ))}
      </span>
    </div>
  );
}
