import { ArrowDownIcon } from "lucide-react";
import { Accented } from "@/components/ui/Accented";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Container } from "@/components/ui/Container";
import { SceneBeats } from "@/components/ui/SceneBeats";
import { chapters, getChapter, profile } from "@/data/content";

/**
 * Chapter 1: the hero. The page's h1 is the name; the headline is the display line.
 * Mobile "pinned stage": name + headline + beats pin under the stage while the packet scales in
 * and its orbit rings draw (see ChapterSection for the scene structure).
 */
export function SparkSection() {
  const chapter = getChapter("spark");
  const index = chapters.findIndex((c) => c.id === "spark");

  return (
    <section
      id={chapter.id}
      data-chapter={chapter.id}
      aria-labelledby="spark-heading"
      // overflow-clip (not hidden): hidden would make this a scroll container and break sticky.
      className="relative flex min-h-svh scroll-mt-16 items-center overflow-clip py-24 stage:block stage:min-h-0 stage:py-0"
    >
      <div aria-hidden="true" className="ambient-glow pointer-events-none absolute inset-0 stage:hidden" />
      <Container className="relative">
        <div data-scene className="stage:h-[175svh]">
          <div
            data-scene-card
            className="stage:sticky stage:top-[55svh] stage:flex stage:h-[45svh] stage:flex-col stage:justify-center stage:pt-3 stage:pb-[80px]"
          >
            <ChapterLabel number={chapter.number} name={chapter.name} />
            <h1 id="spark-heading" className="mt-6 font-display text-subtitle font-bold text-heading stage:mt-2 stage:text-[1.125rem]">
              {profile.name}
            </h1>
            {/* Balanced wrapping; "AI agents." never splits. 3 lines at 360px wide. */}
            <p data-reveal="lines" className="mt-4 font-display text-display font-bold text-balance text-heading stage:mt-1.5 lg:max-w-[10ch]">
              <Accented text={profile.headline} accent={profile.headlineAccent} accentClassName="whitespace-nowrap" />
            </p>
            {chapter.beats && <SceneBeats index={index} beats={chapter.beats} className="stage:mt-3" />}
          </div>
        </div>

        {/* Desktop / reduced motion: intro + scroll cue (on phones the beats say this). */}
        <div className="stage:hidden">
          <div data-reveal="fade" className="mt-8 max-w-[52ch] space-y-3">
            {profile.intro.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <a
            href="#websites"
            className="label-mono mt-12 inline-flex min-h-11 items-center gap-3 rounded-full text-muted transition-colors hover:text-heading"
          >
            <span className="grid size-9 place-items-center rounded-full border border-border-strong">
              <ArrowDownIcon aria-hidden="true" className="size-4 motion-safe:animate-bounce" />
            </span>
            Scroll to follow the data
          </a>
        </div>
      </Container>
    </section>
  );
}
