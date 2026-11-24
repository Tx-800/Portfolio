"use client";

import { useId, useState } from "react";
import type { Satellite } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Corner slots beside the Core, in fill order: x side (+1 right, −1 left), y side (−1 above
 * the centre, +1 below). The round Core leaves its four "corners" empty; satellites float there.
 */
const SLOTS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

const pill = "inline-flex items-center rounded-full border border-heading/25 bg-bg/60 px-2.5 py-1 text-[0.75rem] font-medium text-heading backdrop-blur-md";

function SatelliteItem({ item, slot }: { item: Satellite; slot: [number, number] }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const [sx, sy] = slot;

  return (
    // Stage mode: placed at the Core's centre; CoreEngine moves it into its corner every frame
    // (data-sx / data-sy say which corner).
    <li data-sat data-sx={sx} data-sy={sy} className="stage:pointer-events-auto stage:absolute stage:top-[50svh] stage:left-1/2">
      {item.detail ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={tipId}
          onClick={() => setOpen((v) => !v)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          // 44px tap target around a small pill; the dotted underline says "tap me".
          className="flex min-h-11 items-center"
        >
          <span className={cn(pill, "underline decoration-heading/50 decoration-dotted underline-offset-[3px]", open && "border-accent/70")}>{item.label}</span>
        </button>
      ) : (
        <span className={pill}>{item.label}</span>
      )}
      {item.detail && (
        <p
          id={tipId}
          role="status"
          className={cn(
            // Opens towards the middle of the screen, never off its edge.
            "panel mt-1 w-52 rounded-2xl p-3 text-left text-[1rem] leading-snug text-heading stage:absolute stage:top-full",
            sx > 0 ? "stage:right-0" : "stage:left-0",
            !open && "hidden",
          )}
        >
          {item.detail}
        </p>
      )}
    </li>
  );
}

/** 2–4 tiny facts floating beside the Core (a plain chip row on the stacked layout). */
export function Satellites({ items, label }: { items: readonly Satellite[]; label: string }) {
  return (
    <ul aria-label={label} className="mt-4 flex flex-wrap justify-center gap-2 px-4 stage:static stage:mt-0 stage:block stage:px-0">
      {items.slice(0, SLOTS.length).map((item, i) => (
        <SatelliteItem key={item.label} item={item} slot={SLOTS[i]} />
      ))}
    </ul>
  );
}
