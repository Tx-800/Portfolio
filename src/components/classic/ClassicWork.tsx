import { ClassicSection } from "@/components/classic/ClassicSection";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { projectsInGroups, type ProjectGroup } from "@/data/content";

const groups: { title: string; description: string; groups: ProjectGroup[] }[] = [
  {
    title: "AI agents & data",
    description: "In production at a large real estate firm.",
    groups: ["agents", "data"],
  },
  {
    title: "Websites & products",
    description: "Freelance client work and portfolio projects.",
    groups: ["product", "web"],
  },
];

export function ClassicWork() {
  return (
    <ClassicSection
      id="work"
      number="02"
      label="Work"
      title="Selected work"
      intro="Every project opens a full case study: the problem, what I built, how it works and the results."
    >
      <div className="space-y-16">
        {groups.map((group) => (
          <div key={group.title}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-subtitle">{group.title}</h3>
              <p className="text-muted">{group.description}</p>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projectsInGroups(group.groups).map((project) => (
                <li key={project.slug}>
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </ClassicSection>
  );
}
