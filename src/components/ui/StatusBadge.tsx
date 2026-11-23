import { statusLabels, type ProjectStatus } from "@/data/content";
import { cn } from "@/lib/utils";

/** Small gold mono pill. The dot pulses for in-development work. */
export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1.5 tracking-[0.08em] text-gold",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full bg-gold",
          status === "in-development" && "animate-pulse motion-reduce:animate-none",
          status === "practice" && "bg-transparent ring-1 ring-gold",
        )}
      />
      {statusLabels[status]}
    </span>
  );
}
