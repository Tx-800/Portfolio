import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { caption, ChapterTag, HeadingLine, sceneClass } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import type { StopId } from "@/components/core/timeline";
import { coreText, experience, getChapter, skillGroups } from "@/data/content";

const ROLE_STOPS: StopId[] = ["builder.role", "builder.freelance", "builder.portfolio"];

/**
 * 08 — The Builder: a spinning skill globe with the four skill groups as satellites (tap for the
 * skills), then the work as short beats: the role, freelance, portfolio projects (no dates).
 */
export function BuilderChapter() {
  const builder = getChapter("builder");
  const groups = skillGroups.map((group) => ({
    label: group.name,
    detail: group.skills.map((skill) => (skill.note ? `${skill.name} (${skill.note})` : skill.name)).join(", "),
  }));

  return (
    <section aria-labelledby="core-builder" className={sceneClass}>
      <h2 id="core-builder" className="sr-only">
        {builder.heading}
      </h2>
      <Beat id="builder.skills">
        <TopZone>
          <ChapterTag chapter={builder} />
          <HeadingLine text={coreText.builderHeading} accent="toolkit" className="mt-3" />
        </TopZone>
        <Satellites items={groups} label={builder.name} />
        <BottomZone>
          <p className={caption}>{builder.intro}</p>
          <p className="mt-2 hidden label-mono text-muted stage:block">{coreText.spinHint}</p>
        </BottomZone>
      </Beat>

      {experience.slice(0, ROLE_STOPS.length).map((role, i) => (
        <Beat key={role.title} id={ROLE_STOPS[i]}>
          <TopZone>
            <p className="label-mono text-gold">{role.org}</p>
            <h3 className="mt-2 text-[clamp(2rem,9.5vw,3rem)] leading-[1] font-bold tracking-[-0.04em] text-balance text-heading">{role.title}</h3>
          </TopZone>
          <BottomZone>
            {/* ≤ ~25 words on screen: the short line; the full points are on desktop and in the Classic View. */}
            <p className={caption}>{role.short}</p>
          </BottomZone>
        </Beat>
      ))}
    </section>
  );
}
