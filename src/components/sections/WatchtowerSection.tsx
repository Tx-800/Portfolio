import { ChapterSection } from "@/components/sections/ChapterSection";
import { FlowSteps } from "@/components/ui/FlowSteps";
import { ProjectSpotlight } from "@/components/ui/ProjectSpotlight";
import { getChapter, getProject } from "@/data/content";

export function WatchtowerSection() {
  const project = getProject("staleness-agent");

  return (
    <ChapterSection chapter={getChapter("watchtower")} layout="right">
      {project && (
        <ProjectSpotlight project={project}>
          {/* Legend for the 3D station: fresh tables glow warm, stale ones turn cold blue. */}
          <ul aria-label="Table states" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[0.8125rem]">
            <li className="flex items-center gap-2 text-heading">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent shadow-glow" />
              Fresh
            </li>
            <li className="flex items-center gap-2 text-stale">
              <span aria-hidden="true" className="size-2 rounded-full bg-stale" />
              Stale — older than 24h
            </li>
          </ul>
          <FlowSteps steps={project.caseStudy.flow} compact className="mt-6" />
        </ProjectSpotlight>
      )}
    </ChapterSection>
  );
}
