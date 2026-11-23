import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface ClassicSectionProps {
  id: string;
  number: string;
  label: string;
  title: string;
  accent?: string;
  intro?: string;
  children: React.ReactNode;
}

/** Shared frame for Classic View sections: anchor, label, heading, content. */
export function ClassicSection({ id, number, label, title, accent, intro, children }: ClassicSectionProps) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-20 border-t border-border/70 py-20 md:py-28">
      <Container>
        <SectionHeading id={headingId} number={number} label={label} title={title} accent={accent} intro={intro} />
        <div className="mt-12 md:mt-16">{children}</div>
      </Container>
    </section>
  );
}
