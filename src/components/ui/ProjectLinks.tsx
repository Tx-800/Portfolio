import { ArrowUpRightIcon, LockIcon } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import type { Project } from "@/data/content";
import { cn } from "@/lib/utils";

/** Live / repo links, "Coming soon", or a note that internal tools have no public link. */
export function ProjectLinks({ project, className }: { project: Project; className?: string }) {
  const { live, repo, comingSoon } = project.links;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {live && (
        <ButtonLink href={live} icon={<ArrowUpRightIcon />}>
          Visit live site
        </ButtonLink>
      )}
      {repo && (
        <ButtonLink href={repo} variant="secondary" icon={<GithubIcon />}>
          Source code
        </ButtonLink>
      )}
      {comingSoon && (
        <span className="label-mono inline-flex min-h-11 items-center rounded-full border border-dashed border-border-strong px-5 text-muted">
          Coming soon
        </span>
      )}
      {!live && !repo && !comingSoon && (
        <span className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] text-muted">
          <LockIcon aria-hidden="true" className="size-4" />
          Internal tool — no public link
        </span>
      )}
    </div>
  );
}
