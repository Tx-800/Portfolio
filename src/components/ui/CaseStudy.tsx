import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { BulletList } from "@/components/ui/BulletList";
import { CaseStudyHeader } from "@/components/ui/CaseStudyHeader";
import { CaseStudyToc, type TocItem } from "@/components/ui/CaseStudyToc";
import { Container } from "@/components/ui/Container";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { MediaGallery } from "@/components/ui/MediaGallery";
import { MetricCounter } from "@/components/ui/MetricCounter";
import { ProjectLinks } from "@/components/ui/ProjectLinks";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TechChips } from "@/components/ui/TechChips";
import { Txt } from "@/components/ui/Txt";
import { projects, type Project } from "@/data/content";

interface Section extends TocItem {
  content: React.ReactNode;
}

/** Builds the case study sections in the brief's fixed order; the TOC reads the same list. */
function buildSections(project: Project): Section[] {
  const cs = project.caseStudy;
  const sections: (Section | false)[] = [
    { id: "overview", title: "Overview", content: <p><Txt>{cs.overview}</Txt></p> },
    { id: "problem", title: "The problem", content: <Paragraphs items={cs.problem} /> },
    { id: "built", title: "What I built", content: <Paragraphs items={cs.built} /> },
    !!cs.progress && {
      id: "progress",
      title: "Built vs in progress",
      content: (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="card p-6">
            <p className="label-mono text-gold">Built</p>
            <BulletList items={cs.progress.built} className="mt-4" />
          </div>
          <div className="card p-6">
            <p className="label-mono text-accent-2">In progress</p>
            <BulletList items={cs.progress.inProgress} className="mt-4" />
          </div>
        </div>
      ),
    },
    { id: "features", title: "Key features", content: <BulletList items={cs.features} /> },
    { id: "how-it-works", title: "How it works", content: <FlowSteps steps={cs.flow} /> },
    { id: "role", title: "My role", content: <p><Txt>{cs.role}</Txt></p> },
    { id: "tech", title: "Tech stack", content: <TechChips items={project.tech} /> },
    {
      id: "results",
      title: "Results / impact",
      content: (
        <ul className="grid gap-4 sm:grid-cols-2">
          {cs.results.map((r) => (
            <li key={r.label}>
              <MetricCounter label={r.label} before={r.before} after={r.after} note={r.note} />
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "status",
      title: "Status",
      content: (
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={project.status} />
          {project.date && <span className="label-mono text-muted">{project.date}</span>}
          <span className="text-muted">· {project.context}</span>
        </div>
      ),
    },
    { id: "links", title: "Links", content: <ProjectLinks project={project} /> },
    {
      id: "media",
      title: project.caseStudy.media.some((m) => m.kind === "diagram") ? "Diagram" : "Screenshots",
      content: <MediaGallery project={project} />,
    },
  ];
  return sections.filter((s): s is Section => s !== false);
}

export function CaseStudy({ project, variant = "page" }: { project: Project; variant?: "page" | "modal" }) {
  const sections = buildSections(project);
  const index = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(index + 1) % projects.length];
  // In the overlay the title is an h2, so section titles drop one level.
  const SectionTitle = variant === "modal" ? "h3" : "h2";

  return (
    <article>
      <CaseStudyHeader project={project} variant={variant} />

      <Container className="grid gap-12 border-t border-border/70 pt-16 pb-24 lg:grid-cols-12 lg:pt-20">
        <CaseStudyToc items={sections} />
        <div className="space-y-16 md:space-y-20 lg:col-span-9 lg:max-w-[820px]">
          {sections.map((section, i) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-24">
              <p className="label-mono text-gold">{String(i + 1).padStart(2, "0")}</p>
              <SectionTitle id={`${section.id}-title`} className="mt-2 text-subtitle">
                {section.title}
              </SectionTitle>
              <div className="mt-6">{section.content}</div>
            </section>
          ))}
        </div>
      </Container>

      <Container className="pb-24">
        <Link
          href={`/work/${next.slug}`}
          scroll={false}
          prefetch
          className="card group flex flex-col gap-2 p-6 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <span className="label-mono text-muted">Next case study</span>
          <span className="flex items-center gap-3 font-display text-subtitle font-bold text-heading">
            {next.title}
            <ArrowRightIcon aria-hidden="true" className="size-5 text-accent transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </Link>
      </Container>
    </article>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <p key={item}>
          <Txt>{item}</Txt>
        </p>
      ))}
    </div>
  );
}
