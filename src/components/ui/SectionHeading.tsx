import { Accented } from "@/components/ui/Accented";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Txt } from "@/components/ui/Txt";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  id: string;
  number: string;
  label: string;
  title: string;
  accent?: string;
  intro?: string;
  className?: string;
}

export function SectionHeading({ id, number, label, title, accent, intro, className }: SectionHeadingProps) {
  return (
    <header className={cn("max-w-[62ch]", className)}>
      <ChapterLabel number={number} name={label} />
      <h2 id={id} className="mt-4 text-title font-bold">
        <Accented text={title} accent={accent} />
      </h2>
      {intro && (
        <p className="mt-5">
          <Txt>{intro}</Txt>
        </p>
      )}
    </header>
  );
}
