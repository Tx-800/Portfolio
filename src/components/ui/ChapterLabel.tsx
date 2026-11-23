import { cn } from "@/lib/utils";

interface ChapterLabelProps {
  number: string;
  name: string;
  className?: string;
}

/** Gold mono chapter label: "01 — THE SPARK". */
export function ChapterLabel({ number, name, className }: ChapterLabelProps) {
  return (
    <p className={cn("label-mono text-gold", className)}>
      {number}
      <span aria-hidden="true"> — </span>
      <span className="sr-only">: </span>
      {name}
    </p>
  );
}
