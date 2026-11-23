import { ChapterSection } from "@/components/sections/ChapterSection";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { WebsitesCarousel } from "@/components/ui/WebsitesCarousel";
import { getChapter, projectsInChapter } from "@/data/content";

export function WebsitesSection() {
  const projects = projectsInChapter("websites");
  return (
    <ChapterSection chapter={getChapter("websites")} layout="wide" stageContent={<WebsitesCarousel projects={projects} />}>
      {/* Desktop grid; on phones the carousel in the pinned card replaces it. */}
      <ul className="grid gap-4 md:grid-cols-3 stage:hidden">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
    </ChapterSection>
  );
}
