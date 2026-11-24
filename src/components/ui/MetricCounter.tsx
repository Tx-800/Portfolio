import { ArrowRightIcon } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { Txt } from "@/components/ui/Txt";
import { cn } from "@/lib/utils";

interface MetricCounterProps {
  label: string;
  before?: string;
  after: string;
  note?: string;
  className?: string;
}

/** Translucent before → after tile with a big gold mono value that counts up into view. */
export function MetricCounter({ label, before, after, note, className }: MetricCounterProps) {
  // Only short numeric values (e.g. "3–5 min") get the big size; words ("One email") would wrap.
  const isShort = after.length <= 9 && /\d/.test(after);

  return (
    <div className={cn("panel flex h-full flex-col p-6 sm:p-7", className)}>
      <p className="label-mono text-muted">{label}</p>

      <div className="mt-6 flex flex-col gap-2">
        {before && (
          <p className="flex items-center gap-2 font-mono text-[0.9375rem] text-muted">
            <span className="sr-only">Before: </span>
            <span className="line-through decoration-muted/60">{before}</span>
            <ArrowRightIcon aria-hidden="true" className="size-4 text-accent" />
          </p>
        )}
        <p className={cn("font-mono font-medium text-gold", isShort ? "text-metric" : "text-[1.625rem] leading-tight")}>
          {before && <span className="sr-only">After: </span>}
          {/* Only before → after results count up; a rule like "24-hour rule" stays as written. */}
          {before ? <CountUp text={after} /> : after}
        </p>
      </div>

      {note && (
        <p className="mt-auto pt-6 text-[0.9375rem]">
          <Txt>{note}</Txt>
        </p>
      )}
    </div>
  );
}
