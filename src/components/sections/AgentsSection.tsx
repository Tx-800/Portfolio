import { ChapterSection } from "@/components/sections/ChapterSection";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { StackedCards } from "@/components/ui/StackedCards";
import { getChapter, projectsInChapter } from "@/data/content";

export function AgentsSection() {
  const projects = projectsInChapter("agents");
  return (
    <ChapterSection chapter={getChapter("agents")} layout="wide">
      {/* Desktop grid; on phones the cards stack as they scroll. */}
      <ul className="grid gap-4 md:grid-cols-2 stage:hidden">
        {projects.map((project) => (
          <li key={project.slug}>
            <ProjectCard project={project} />
          </li>
        ))}
      </ul>
      <StackedCards projects={projects} />
    </ChapterSection>
  );
}
