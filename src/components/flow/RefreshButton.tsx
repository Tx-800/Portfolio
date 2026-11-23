"use client";

import { RefreshCwIcon } from "lucide-react";
import { flowText } from "@/data/content";
import { flowInput } from "@/store/flow";

/** Pipeline toy: sends a burst of pulses through the tubes and a sweep up the cube layers. */
export function RefreshButton() {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => {
          flowInput.pipeline.refreshAt = performance.now() / 1000;
        }}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-plasma px-5 text-[0.9375rem] font-semibold text-bg shadow-glow transition-[box-shadow,transform] duration-300 active:scale-[0.97]"
      >
        <RefreshCwIcon aria-hidden="true" className="size-4" />
        {flowText.refresh}
      </button>
      <span className="text-[0.875rem] text-muted">{flowText.refreshHint}</span>
    </div>
  );
}
