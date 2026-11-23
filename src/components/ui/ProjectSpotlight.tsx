import { ArrowRightIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TechChips } from "@/components/ui/TechChips";
import { Txt } from "@/components/ui/Txt";
import type { Project } from "@/data/content";

/** Single-project highlight inside a chapter panel (LocalPilot, Snowflake, Staleness). */
export function ProjectSpotlight({ project, children }: { project: Project; children?: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-border pt-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge status={project.status} />
        {project.date && <span className="label-mono text-muted">{project.date}</span>}
      </div>
      <h3 className="mt-5 text-subtitle">{project.title}</h3>
      <p className="mt-3">
        <Txt>{project.summary}</Txt>
      </p>
      {children}
      <TechChips items={project.tech} className="mt-6" />
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={`/work/${project.slug}`} scroll={false} prefetch icon={<ArrowRightIcon />}>
          Read case study
        </ButtonLink>
        {project.links.live && (
          <ButtonLink href={project.links.live} variant="secondary">
            Visit live
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
