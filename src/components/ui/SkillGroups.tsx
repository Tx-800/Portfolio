import type { SkillGroup } from "@/data/content";
import { cn } from "@/lib/utils";

export function SkillGroups({ groups, className }: { groups: SkillGroup[]; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {groups.map((group) => (
        <section key={group.name} aria-label={group.name} className="card p-6">
          <h3 className="label-mono text-gold">{group.name}</h3>
          <ul className="mt-5 space-y-3">
            {group.skills.map((skill) => (
              <li key={skill.name} className="text-heading">
                {skill.name}
                {skill.note && <span className="text-muted"> · {skill.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
