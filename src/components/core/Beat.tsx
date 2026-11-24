import { STOPS, type StopId } from "@/components/core/timeline";
import { cn } from "@/lib/utils";

interface BeatProps {
  id: StopId;
  className?: string;
  children: React.ReactNode;
}

/**
 * One content beat: everything on screen during one hold (see STOPS in timeline.ts).
 * Stage mode: covers the visible screen (svh) so its transform-origin is the Core's centre;
 * CoreEngine moves it in depth every frame. Only the first beat is visible before the engine
 * starts, so nothing flashes. Stacked layout: a plain block.
 */
export function Beat({ id, className, children }: BeatProps) {
  const first = STOPS[0].id === id;
  return (
    <div
      data-beat={id}
      className={cn(
        "relative py-8 stage:pointer-events-none stage:absolute stage:inset-x-0 stage:top-0 stage:h-svh stage:py-0 stage:will-change-transform",
        !first && "stage:invisible stage:opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Text above the Core: its bottom edge sits just above the Core, so it can grow upwards freely. */
export function TopZone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-4 text-center stage:absolute stage:inset-x-0 stage:bottom-[calc(50svh+var(--core-r,28vw)+34px)]", className)}>{children}</div>
  );
}

/** Text below the Core: starts just under it. */
export function BottomZone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-5 px-4 text-center stage:absolute stage:inset-x-0 stage:top-[calc(50svh+var(--core-r,28vw)+34px)] stage:mt-0", className)}>
      {children}
    </div>
  );
}
