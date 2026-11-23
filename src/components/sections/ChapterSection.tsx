import { Accented } from "@/components/ui/Accented";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Container } from "@/components/ui/Container";
import { SceneBeats } from "@/components/ui/SceneBeats";
import { Txt } from "@/components/ui/Txt";
import { chapters, type Chapter } from "@/data/content";
import { cn } from "@/lib/utils";

interface ChapterSectionProps {
  chapter: Chapter;
  /**
   * Desktop. left/right: a single frosted panel on that side, leaving room for the 3D station.
   * wide: heading panel on top, then full-width content (card grids).
   */
  layout?: "left" | "right" | "wide";
  /** Mobile pinned card: replaces the text beats (e.g. the websites carousel, impact metrics). */
  stageContent?: React.ReactNode;
  /** Desktop: inside the panel (left/right) or below it (wide). Mobile: scrolls after the scene. */
  children?: React.ReactNode;
}

/**
 * One journey chapter, one DOM for both layouts:
 *
 *   Desktop (and reduced motion / no WebGL): a frosted panel beside or above the 3D station.
 *
 *   Mobile "pinned stage" (`stage:` variant): the section becomes
 *     [data-scene]        a tall block (175svh) whose card pins under the 3D stage
 *       [data-scene-card] sticky in the bottom 45svh: label, heading, scrubbed beats
 *     intro + children    then scroll normally (the stage slides away for long content)
 *   The scroll engine (hooks/useJourneyScroll.ts) measures these two data attributes.
 */
export function ChapterSection({ chapter, layout = "left", stageContent, children }: ChapterSectionProps) {
  const headingId = `${chapter.id}-heading`;
  const isWide = layout === "wide";
  const index = chapters.findIndex((c) => c.id === chapter.id);

  return (
    <section
      id={chapter.id}
      data-chapter={chapter.id}
      aria-labelledby={headingId}
      className="relative flex min-h-svh scroll-mt-16 items-center py-24 md:py-32 stage:block stage:min-h-0 stage:py-0"
    >
      {/* xl:pr-64 keeps content clear of the fixed chapter rail on the right. */}
      <Container className="xl:pr-64 stage:xl:pr-6">
        <div
          className={cn(
            "chapter-frame p-6 sm:p-10 stage:p-0 sm:stage:p-0",
            isWide ? "max-w-2xl" : "lg:w-[min(600px,50%)]",
            layout === "right" && "lg:ml-auto",
            "stage:max-w-none lg:stage:ml-0 lg:stage:w-auto",
          )}
        >
          <div data-scene className="stage:h-[175svh]">
            {/* Bottom padding keeps the beats clear of the fixed chapter bar. */}
            <div
              data-scene-card
              className="stage:sticky stage:top-[55svh] stage:flex stage:h-[45svh] stage:flex-col stage:justify-center stage:pt-4 stage:pb-[84px]"
            >
              <ChapterLabel number={chapter.number} name={chapter.name} />
              <h2 id={headingId} data-reveal="lines" className="mt-4 text-title font-bold stage:mt-2.5 stage:text-[1.625rem] stage:leading-[1.12]">
                <Accented text={chapter.heading} accent={chapter.accent} />
              </h2>
              {stageContent ?? (chapter.beats && <SceneBeats index={index} beats={chapter.beats} />)}
            </div>
          </div>

          <div className="stage:pt-6 stage:pb-16">
            <p className="mt-5 stage:mt-0">
              <Txt>{chapter.intro}</Txt>
            </p>
            {!isWide && children}
          </div>
        </div>
        {isWide && (
          <div data-reveal="fade" className="mt-6 md:mt-8 stage:mt-0 stage:pb-16">
            {children}
          </div>
        )}
      </Container>
    </section>
  );
}
