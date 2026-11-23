import { FlowChapter } from "@/components/flow/FlowChapter";
import { FlowProgress } from "@/components/flow/FlowProgress";
import { RefreshButton } from "@/components/flow/RefreshButton";
import { SparkDrag } from "@/components/flow/SparkDrag";
import { WebsitesStrip } from "@/components/flow/WebsitesStrip";
import { FlowCanvas } from "@/components/three/flow/FlowCanvas";
import { Accented } from "@/components/ui/Accented";
import { Container } from "@/components/ui/Container";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { flowText, getChapter, getProject, profile, projectsInChapter } from "@/data/content";

/**
 * Mobile "flow" prototype: a normal, natively scrolling page; one transparent canvas above it
 * draws each chapter's station inside its data-anchor slot, and the packet flies between them.
 *
 * The wrapper is `relative` (positioning context for the absolutely positioned canvas) and
 * `overflow: clip` (the 1.5×-viewport canvas must not extend the page's scroll height; unlike
 * `hidden`, `clip` doesn't create a scroll container). One type family: Sora for everything,
 * mono only for labels.
 */
export function FlowPage({ screenshots }: { screenshots: Record<string, string> }) {
  const spark = getChapter("spark");
  const pipelineProject = getProject("snowflake-data-platform");

  return (
    <div className="relative overflow-clip font-display">
      <FlowCanvas screenshots={screenshots} />
      <FlowProgress />

      <Container className="pt-6">
        <p className="label-mono text-muted">{flowText.prototypeNote}</p>
      </Container>

      <FlowChapter
        chapter={spark}
        anchor="spark"
        heading={
          <>
            <h1 id={`flow-${spark.id}-heading`} className="mt-4 text-[1.125rem] font-semibold text-heading">
              {profile.name}
            </h1>
            <p className="mt-2 text-[clamp(2.4rem,10.5vw,4.25rem)] leading-[0.98] font-bold tracking-[-0.04em] text-balance text-heading">
              <Accented text={profile.headline} accent={profile.headlineAccent} accentClassName="whitespace-nowrap" />
            </p>
          </>
        }
        caption={flowText.sparkCaption}
        slot={<SparkDrag />}
      />

      <FlowChapter
        chapter={getChapter("websites")}
        anchor="websites"
        caption={getChapter("websites").intro}
        slot={<WebsitesStrip projects={projectsInChapter("websites")} />}
      />

      <FlowChapter
        chapter={getChapter("pipeline")}
        anchor="pipeline"
        caption={getChapter("pipeline").intro}
        toy={<RefreshButton />}
        card={pipelineProject && <ProjectCard project={pipelineProject} variant="stage" />}
      />
    </div>
  );
}
