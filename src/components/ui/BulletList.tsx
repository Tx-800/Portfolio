import { Txt } from "@/components/ui/Txt";
import { cn } from "@/lib/utils";

export function BulletList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          <span aria-hidden="true" className="mt-[0.75em] h-px w-3 shrink-0 bg-accent" />
          <span>
            <Txt>{item}</Txt>
          </span>
        </li>
      ))}
    </ul>
  );
}
