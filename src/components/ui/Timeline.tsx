import { Txt } from "@/components/ui/Txt";
import type { ExperienceItem } from "@/data/content";
import { cn } from "@/lib/utils";

export function Timeline({ items, className }: { items: ExperienceItem[]; className?: string }) {
  return (
    <ol className={cn("relative border-l border-border-strong", className)}>
      {items.map((item) => (
        <li key={`${item.title}-${item.org}`} className="relative pb-12 pl-8 last:pb-0 sm:pl-10">
          <span
            aria-hidden="true"
            className="bg-signature absolute top-2 -left-[5px] size-[9px] rounded-full shadow-glow"
          />
          {item.period && <p className="label-mono text-gold">{item.period}</p>}
          <h3 className="mt-2 text-subtitle">
            <Txt>{item.title}</Txt>
          </h3>
          <p className="mt-1">{item.org}</p>
          <ul className="mt-4 space-y-2">
            {item.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.75em] h-px w-3 shrink-0 bg-accent" />
                <span>
                  <Txt>{point}</Txt>
                </span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
