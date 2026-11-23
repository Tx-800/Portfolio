import { ArrowDownIcon, ArrowRightIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { Container } from "@/components/ui/Container";
import { boot, getChapter } from "@/data/content";

/**
 * Chapter 0. Static HTML for now; Phase 5 turns it into the full-screen loader overlay
 * with typing lines and an interactive prompt (help, sudo hire…).
 */
export function BootSection() {
  const chapter = getChapter("boot");

  // Mobile stage: the terminal sits under the stage (Boot station above it), lines hidden.
  return (
    <section
      id={chapter.id}
      data-chapter={chapter.id}
      aria-label={chapter.name}
      className="relative flex min-h-[70svh] items-center py-20 stage:min-h-svh stage:items-end stage:pt-[calc(55svh+1rem)] stage:pb-24"
    >
      <Container>
        <div className="panel mx-auto max-w-2xl overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent-2/80" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-accent/80" />
            <span aria-hidden="true" className="size-2.5 rounded-full bg-gold/80" />
            <ChapterLabel number={chapter.number} name={chapter.name} className="ml-3 text-muted" />
          </div>
          <div className="space-y-2 p-6 font-mono text-[0.9375rem] text-body sm:p-8 stage:hidden">
            {boot.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p className="text-heading">
              &gt; ready<span aria-hidden="true" className="ml-1 inline-block h-[1.1em] w-2 translate-y-[0.2em] bg-accent" />
            </p>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-border p-6 sm:px-8">
            <ButtonLink href="#spark" icon={<ArrowDownIcon />}>
              {boot.startLabel}
            </ButtonLink>
            <ButtonLink href="/classic" variant="secondary" icon={<ArrowRightIcon />}>
              {boot.skipLabel}
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
