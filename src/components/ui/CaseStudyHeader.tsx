import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ProjectLinks } from "@/components/ui/ProjectLinks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TechChips } from "@/components/ui/TechChips";
import { Txt } from "@/components/ui/Txt";
import { uiText, type Project } from "@/data/content";

interface CaseStudyHeaderProps {
  project: Project;
  /** In the overlay the title is an h2 (the page keeps its one h1) and labels the dialog. */
  variant?: "page" | "modal";
}

export function CaseStudyHeader({ project, variant = "page" }: CaseStudyHeaderProps) {
  const Title = variant === "modal" ? "h2" : "h1";
  return (
    <header className={variant === "modal" ? "relative overflow-hidden pt-4 pb-12 md:pt-8 md:pb-16" : "relative overflow-hidden pt-10 pb-16 md:pt-14 md:pb-20"}>
      <div aria-hidden="true" className="ambient-glow pointer-events-none absolute inset-x-0 -top-24 h-[560px]" />
      <Container className="relative">
        {variant === "page" && (
          <Link
            href={`/#${project.chapter}`}
            className="label-mono mb-8 inline-flex min-h-11 items-center gap-2 text-muted transition-colors hover:text-heading"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            {uiText.caseStudy.backToJourney}
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusBadge status={project.status} />
          {project.date && <span className="label-mono text-muted">{project.date}</span>}
          <span className="font-mono text-[0.8125rem] text-muted">
            {/* The separator only makes sense when the context sits on the same line. */}
            <span aria-hidden="true" className="hidden sm:inline">· </span>
            {project.context}
          </span>
        </div>

        <Title id="case-title" className="mt-6 max-w-[18ch] text-display font-bold">
          {project.title}
        </Title>
        <p className="mt-6 max-w-[40ch] font-display text-subtitle font-bold text-heading">
          <Txt>{project.tagline}</Txt>
        </p>

        <ProjectLinks project={project} className="mt-9" />
        <TechChips items={project.tech} className="mt-8" />
      </Container>
    </header>
  );
}
