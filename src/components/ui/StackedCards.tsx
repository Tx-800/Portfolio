import { ProjectCard } from "@/components/ui/ProjectCard";
import type { Project } from "@/data/content";

/**
 * Mobile "stacked cards": each card is sticky a little lower than the one before, so as you
 * scroll they pile up like a deck. Pure CSS (position: sticky). Hidden outside stage mode;
 * tapping a card opens its case study sheet.
 */
export function StackedCards({ projects }: { projects: Project[] }) {
  return (
    // Extra room after the last card gives the deck time to settle before the next chapter.
    <ul className="hidden space-y-5 pb-[20svh] stage:block">
      {projects.map((project, i) => (
        <li key={project.slug} className="sticky" style={{ top: `${80 + i * 18}px` }}>
          <ProjectCard project={project} variant="stage" className="bg-surface" />
        </li>
      ))}
    </ul>
  );
}
