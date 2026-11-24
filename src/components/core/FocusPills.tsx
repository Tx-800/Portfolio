"use client";

import { useState } from "react";
import { core } from "@/components/core/timeline";
import { coreText } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * The two agent clusters as tap targets, floating in the Core's top corners (left = QAgent,
 * right = Compliance, matching the network). Tapping one focuses that cluster in the 3D
 * (core.focusOverride); once the Core stops being the network, the scroll takes over again.
 */
export function FocusPills({ initial }: { initial: -1 | 1 }) {
  const [focus, setFocus] = useState<number>(initial);
  return (
    <ul aria-label={coreText.clusterHint} className="mt-4 flex justify-center gap-2 stage:static stage:mt-0 stage:block">
      {coreText.clusters.map((label, i) => {
        const side = i === 0 ? -1 : 1;
        const active = focus === side;
        return (
          <li key={label} data-sat data-sx={side} data-sy={-1} className="stage:pointer-events-auto stage:absolute stage:top-[50svh] stage:left-1/2">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => {
                setFocus(side);
                core.focusOverride = side;
              }}
              className="flex min-h-11 items-center"
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-medium backdrop-blur-md transition-colors",
                  active ? "border-accent/80 bg-accent/20 text-heading" : "border-heading/25 bg-bg/60 text-body",
                )}
              >
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-accent" : "bg-heading/40")} />
                {label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
