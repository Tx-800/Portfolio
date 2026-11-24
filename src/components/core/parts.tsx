import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Accented } from "@/components/ui/Accented";
import { coreText, type Chapter } from "@/data/content";
import { cn } from "@/lib/utils";

/** Big, bold, short: headings around the Core. */
export const big = "font-bold text-[clamp(2.25rem,10.5vw,3.5rem)] leading-[0.98] tracking-[-0.045em] text-heading text-balance";
/** The Impact: the "after", huge and uppercase (add a colour, e.g. text-signature). */
export const huge = "font-bold uppercase text-[clamp(2.6rem,13.5vw,5.5rem)] leading-[0.92] tracking-[-0.045em]";
/** The Impact: the "before", outlined and struck through. */
export const struck =
  "font-bold uppercase text-[clamp(2.1rem,10.5vw,4.25rem)] leading-[0.95] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1.5px_var(--color-heading)] line-through decoration-heading decoration-[3px]";
/** 1–3 line caption. */
export const caption = "mx-auto max-w-[21rem] text-[1.0625rem] leading-snug text-heading";

/** "04 — The Pipeline & Warehouse" */
export function ChapterTag({ chapter, className }: { chapter: Chapter; className?: string }) {
  return <p className={cn("label-mono text-gold", className)}>{`${chapter.number} — ${chapter.name}`}</p>;
}

/** "Read case study" pill: opens the case-study sheet (intercepted route) over the stage. */
export function CaseStudyPill({ slug }: { slug: string }) {
  return (
    <Link
      href={`/work/${slug}`}
      scroll={false}
      prefetch
      className="pointer-events-auto mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-heading px-5 text-[0.9375rem] font-semibold text-bg"
    >
      {coreText.readCaseStudy}
      <ArrowUpRightIcon aria-hidden="true" className="size-4" />
    </Link>
  );
}

/**
 * A heading split around the Core: the first line in the top zone, the second in the bottom
 * zone. Screen readers get the whole sentence once (the visible halves are aria-hidden).
 */
export function SplitHeading({ lines, as: Tag = "p", id }: { lines: readonly string[]; as?: "h2" | "p"; id?: string }) {
  return (
    <Tag id={id} className="sr-only">
      {lines.join(" ")}
    </Tag>
  );
}

export function HeadingLine({ text, accent, className }: { text: string; accent?: string; className?: string }) {
  return (
    <p aria-hidden="true" className={cn(big, className)}>
      <Accented text={text} accent={accent} />
    </p>
  );
}

/** A chapter's <section>: static in stage mode (its beats position themselves), padded when stacked. */
export const sceneClass = "relative mx-auto max-w-2xl py-10 stage:static stage:max-w-none stage:py-0";
