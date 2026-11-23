"use client";

import { useEffect, useRef } from "react";
import type { Metric } from "@/data/content";
import { cn } from "@/lib/utils";
import { journeyStore } from "@/store/journey";

interface MetricBeatsProps {
  /** Chapter index whose scene progress drives the beats. */
  index: number;
  metrics: Metric[];
}

/** Writes `text` with every number scaled by k (0 → 1): "3–5 min" at 0.5 → "2–3 min". */
function scaleNumbers(text: string, k: number): string {
  return text.replace(/\d+(?:\.\d+)?/g, (n) => String(Math.round(Number(n) * k)));
}

/**
 * Mobile Impact scene: one metric per beat. As the scene is scrubbed, the active metric's
 * numbers count up with the scroll (and back down when scrolling up). Before → after metrics
 * count; rules such as "24-hour rule" are shown as written. DOM writes from a store
 * subscription, no React re-renders.
 */
export function MetricBeats({ index, metrics }: MetricBeatsProps) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let current = -1;
    const apply = () => {
      const p = journeyStore.getState().sceneP[index];
      const scaled = p * metrics.length;
      const active = Math.min(metrics.length - 1, Math.floor(scaled));
      const items = list.current?.querySelectorAll<HTMLLIElement>("li");
      if (!items) return;
      if (active !== current) {
        current = active;
        items.forEach((li, i) => li.setAttribute("data-state", i < active ? "past" : i === active ? "active" : "next"));
      }
      // Count up over the first 70% of the active beat, then hold the final value.
      const metric = metrics[active];
      const value = items[active]?.querySelector<HTMLElement>("[data-value]");
      if (value && metric.before) value.textContent = scaleNumbers(metric.after, Math.min(1, (scaled - active) / 0.7));
    };
    apply();
    return journeyStore.subscribe(apply);
  }, [index, metrics]);

  return (
    <ol ref={list} className="relative mt-4 hidden h-[5.5rem] stage:block">
      {metrics.map((metric, i) => (
        <li
          key={metric.id}
          data-state={i === 0 ? "active" : "next"}
          className={cn(
            "absolute inset-x-0 top-0 transition-[opacity,translate] duration-500 ease-out",
            "data-[state=active]:translate-y-0 data-[state=active]:opacity-100",
            "data-[state=next]:translate-y-3 data-[state=next]:opacity-0",
            "data-[state=past]:-translate-y-3 data-[state=past]:opacity-0",
          )}
        >
          <p className="label-mono text-muted">{metric.label}</p>
          {/* Short values sit beside the struck-through "before"; long ones get their own line. */}
          <p className={cn("mt-1.5 flex font-mono", metric.after.length > 9 ? "flex-col gap-1" : "items-baseline gap-2")}>
            {metric.before && <span className="text-[0.875rem] text-muted line-through decoration-muted/60">{metric.before}</span>}
            <span data-value className="text-[1.625rem] leading-none font-medium text-gold tabular-nums">
              {metric.after}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
