import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { BulletList } from "@/components/ui/BulletList";
import { ProjectCardFrame } from "@/components/ui/ProjectCardFrame";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TechChips } from "@/components/ui/TechChips";
import { Txt } from "@/components/ui/Txt";
import type { Project } from "@/data/content";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  className?: string;
  /** "stage" = the mobile copy (carousel / stacked cards). See ProjectCardFrame. */
  variant?: "desk" | "stage";
  /** Compact: badge, date and title only (mobile carousel). */
  compact?: boolean;
}

/**
 * Whole-card link: the title link's ::after covers the card, so the card is one tab stop
 * and screen readers announce just the title. On the journey/classic pages the link opens the
 * case study as an overlay (intercepted route); `scroll={false}` keeps the page where it is.
 */
export function ProjectCard({ project, className, variant, compact }: ProjectCardProps) {
  return (
    <ProjectCardFrame slug={project.slug} variant={variant} className={className}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={project.status} />
        {project.date && <span className="label-mono text-muted">{project.date}</span>}
      </div>

      <h3 className={compact ? "mt-3 text-[1.1875rem] leading-tight" : "mt-6 text-subtitle"}>
        <Link
          href={`/work/${project.slug}`}
          scroll={false}
          // Per-link prefetch: loads the cached overlay ahead of the click, so the morph is instant.
          prefetch
          className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
        >
          {project.title}
        </Link>
      </h3>
      {!compact && <p className="mt-1 font-mono text-[0.8125rem] text-muted">{project.context}</p>}
      {!compact && (
        <>
          <p className="mt-4">
            <Txt>{project.tagline}</Txt>
          </p>
          {project.highlights && <BulletList items={project.highlights} className="mt-4 space-y-1.5 text-[0.9375rem]" />}
          <TechChips items={project.tech} max={4} className="mt-6" />
        </>
      )}

      <p
        className={cn(
          "mt-auto flex items-center gap-1.5 text-[0.9375rem] font-semibold text-heading transition-colors group-hover:text-accent",
          compact ? "pt-3 text-[0.875rem]" : "pt-7",
        )}
      >
        Read case study
        <ArrowUpRightIcon
          aria-hidden="true"
          className="size-[18px] transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </p>
    </ProjectCardFrame>
  );
}
