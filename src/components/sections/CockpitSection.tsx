import { ChapterSection } from "@/components/sections/ChapterSection";
import { ProjectSpotlight } from "@/components/ui/ProjectSpotlight";
import { Txt } from "@/components/ui/Txt";
import { getChapter, getProject } from "@/data/content";

export function CockpitSection() {
  const project = getProject("localpilot");
  const progress = project?.caseStudy.progress;

  return (
    <ChapterSection chapter={getChapter("cockpit")} layout="right">
      {project && (
        <ProjectSpotlight project={project}>
          {progress && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <ProgressList title="Built" items={progress.built} />
              <ProgressList title="In progress" items={progress.inProgress} pending />
            </div>
          )}
        </ProjectSpotlight>
      )}
    </ChapterSection>
  );
}

function ProgressList({ title, items, pending }: { title: string; items: string[]; pending?: boolean }) {
  return (
    <div>
      <p className="label-mono text-gold">{title}</p>
      <ul className="mt-3 space-y-2 text-[0.9375rem]">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={pending ? "mt-[0.6em] size-1.5 shrink-0 rounded-full ring-1 ring-accent-2" : "mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent"}
            />
            <span>
              <Txt>{item}</Txt>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
