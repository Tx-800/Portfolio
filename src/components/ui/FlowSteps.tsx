import { Txt } from "@/components/ui/Txt";
import type { FlowStep } from "@/data/content";
import { cn } from "@/lib/utils";

/** Numbered vertical "how it works" list. `compact` hides the details (chapter panels). */
export function FlowSteps({ steps, compact, className }: { steps: FlowStep[]; compact?: boolean; className?: string }) {
  return (
    <ol className={cn("relative space-y-5", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex gap-4">
          {/* Connector line between step numbers. */}
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="absolute top-9 bottom-[-1.25rem] left-[1.0625rem] w-px bg-border-strong" />
          )}
          <span className="relative grid size-[2.125rem] shrink-0 place-items-center rounded-full border border-border-strong bg-surface-2 font-mono text-[0.8125rem] text-gold">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className={cn("pt-1", compact && "pt-1.5")}>
            <p className="font-semibold text-heading">{step.title}</p>
            {!compact && (
              <p className="mt-1">
                <Txt>{step.detail}</Txt>
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
