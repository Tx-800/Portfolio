import { Txt } from "@/components/ui/Txt";
import { cn } from "@/lib/utils";

interface TechChipsProps {
  items: readonly string[];
  /** Show at most this many chips, then "+N". */
  max?: number;
  className?: string;
}

export function TechChips({ items, max, className }: TechChipsProps) {
  const shown = max ? items.slice(0, max) : items;
  const hidden = items.length - shown.length;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)} aria-label="Tech stack">
      {shown.map((item) => (
        <li key={item} className="rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-[0.8125rem] text-body">
          <Txt>{item}</Txt>
        </li>
      ))}
      {hidden > 0 && (
        <li className="rounded-full px-2 py-1 font-mono text-[0.8125rem] text-muted">
          +{hidden}
          <span className="sr-only"> more</span>
        </li>
      )}
    </ul>
  );
}
