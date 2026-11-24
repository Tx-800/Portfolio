import { BulletList } from "@/components/ui/BulletList";
import type { ExperienceItem } from "@/data/content";
import { cn } from "@/lib/utils";

/** The work, explained: one block per role (no dates, no timeline). */
export function ExperienceList({ items, className }: { items: ExperienceItem[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {items.map((item) => (
        <li key={item.title} className="grid gap-3 py-8 first:pt-0 last:pb-0 md:grid-cols-[14rem_1fr] md:gap-10">
          <div>
            <h3 className="text-subtitle">{item.title}</h3>
            <p className="mt-1 font-mono text-[0.8125rem] text-muted">{item.org}</p>
          </div>
          <BulletList items={item.points} />
        </li>
      ))}
    </ul>
  );
}
