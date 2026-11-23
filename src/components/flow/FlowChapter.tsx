import { Accented } from "@/components/ui/Accented";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Container } from "@/components/ui/Container";
import type { Chapter } from "@/data/content";
import { cn } from "@/lib/utils";

interface FlowChapterProps {
  chapter: Chapter;
  /** id of the 3D slot (data-anchor) the station renders into. */
  anchor: string;
  /** Replaces the default h2 (The Spark uses the page's h1 + headline). */
  heading?: React.ReactNode;
  caption: string;
  /** Touch layer inside the 3D slot (drag surface, swipe strip…). */
  slot?: React.ReactNode;
  /** Small control under the caption (e.g. a button). */
  toy?: React.ReactNode;
  /** Project card(s) at the end of the chapter. */
  card?: React.ReactNode;
  /** Slot height. */
  slotClassName?: string;
}

/**
 * One chapter of the flow layout, single column:
 *   label → BIG heading → 3D slot → caption → toy → card
 * The slot is an empty, full-width box marked data-anchor; the station is drawn exactly inside
 * it by the canvas layered above the page. It pulls up under the heading (negative margin), so
 * the object sits in front of the type.
 */
export function FlowChapter({ chapter, anchor, heading, caption, slot, toy, card, slotClassName }: FlowChapterProps) {
  const headingId = `flow-${chapter.id}-heading`;
  return (
    <section id={chapter.id} aria-labelledby={headingId} className="relative py-14">
      <Container>
        <ChapterLabel number={chapter.number} name={chapter.name} />
        {heading ?? (
          <h2 id={headingId} className="mt-4 text-[clamp(2.4rem,10.5vw,4.25rem)] leading-[0.98] font-bold tracking-[-0.04em] text-balance">
            <Accented text={chapter.heading} accent={chapter.accent} />
          </h2>
        )}
      </Container>

      {/* The 3D slot: full width, ~62% of the screen, tucked under the heading. */}
      <div data-anchor={anchor} className={cn("relative -mt-8 h-[62svh] w-full", slotClassName)}>
        {slot}
      </div>

      <Container>
        <p data-flow-caption className="mt-5 max-w-[calc(100%-4.5rem)] text-[1.0625rem] leading-relaxed text-body">
          {caption}
        </p>
        {toy && <div className="mt-6">{toy}</div>}
        {card && <div className="mt-10">{card}</div>}
      </Container>
    </section>
  );
}
