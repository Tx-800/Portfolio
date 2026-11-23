import { ChapterSection } from "@/components/sections/ChapterSection";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { ProjectSpotlight } from "@/components/ui/ProjectSpotlight";
import { getChapter, getProject } from "@/data/content";

export function PipelineSection() {
  const project = getProject("snowflake-data-platform");

  return (
    <ChapterSection chapter={getChapter("pipeline")} layout="left">
      {project && (
        <ProjectSpotlight project={project}>
          <FlowSteps steps={project.caseStudy.flow} compact className="mt-6" />
        </ProjectSpotlight>
      )}
    </ChapterSection>
  );
}
