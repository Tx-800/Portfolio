import { Txt } from "@/components/ui/Txt";
import type { FlowStep } from "@/data/content";
import { cn } from "@/lib/utils";

/**
 * Compact node → node diagram, used instead of screenshots for internal tools.
 * Vertical on mobile, horizontal from md up.
 */
export function FlowDiagram({ steps, className }: { steps: FlowStep[]; className?: string }) {
  return (
    <ol className={cn("flex flex-col items-start gap-0 md:flex-row md:flex-wrap md:items-center md:gap-y-4", className)}>
      {steps.map((step, i) => (
        <li key={step.title} className="flex flex-col items-start md:flex-row md:items-center">
          <span className="rounded-full border border-border-strong bg-surface-2 px-4 py-2 font-mono text-[0.875rem] text-heading">
            <Txt>{step.title}</Txt>
          </span>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="bg-signature ml-6 h-6 w-px md:mx-2 md:ml-2 md:h-px md:w-8" />
          )}
        </li>
      ))}
    </ol>
  );
}
