import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { caption, CaseStudyPill, ChapterTag, HeadingLine, sceneClass, SplitHeading } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { coreText, getChapter, getProject } from "@/data/content";
import { cn } from "@/lib/utils";

/** 04 — The Pipeline & Warehouse: "Data that refreshes itself" → Sources / Raw → Curated. The Core is a crystal cube. */
export function PipelineChapter() {
  const pipeline = getChapter("pipeline");
  const project = getProject("snowflake-data-platform");
  if (!project) return null;
  return (
    <section id="pipeline" aria-labelledby="core-pipeline" className={sceneClass}>
      <SplitHeading as="h2" id="core-pipeline" lines={coreText.pipelineHeading} />
      <Beat id="pipeline.intro">
        <TopZone>
          <ChapterTag chapter={pipeline} />
          <HeadingLine text={coreText.pipelineHeading[0]} className="mt-3" />
        </TopZone>
        <Satellites items={coreText.pipelineSources.map((label) => ({ label }))} label={pipeline.beats?.[0] ?? pipeline.name} />
        <BottomZone>
          <HeadingLine text={coreText.pipelineHeading[1]} accent={coreText.pipelineHeading[1]} />
          <div className="mt-3 flex flex-col items-center gap-2">
            <StatusBadge status={project.status} />
            <span className="label-mono text-body">{project.title}</span>
          </div>
        </BottomZone>
      </Beat>

      <Beat id="pipeline.flow">
        <SplitHeading lines={coreText.pipelineFlow} />
        <TopZone>
          <HeadingLine text={coreText.pipelineFlow[0]} />
        </TopZone>
        <BottomZone>
          <HeadingLine text={coreText.pipelineFlow[1]} accent="Curated" />
          <p className={cn("mt-3", caption)}>{pipeline.beats?.[2]}</p>
          <CaseStudyPill slug={project.slug} />
        </BottomZone>
      </Beat>
    </section>
  );
}
