import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { CaseStudyPill, ChapterTag, HeadingLine, sceneClass, SplitHeading } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import { coreText, getChapter, getProject } from "@/data/content";

/**
 * 05 — The Watchtower: "Checks freshness daily" → "Stale over 24h? Email sent." (a table turns
 * cold blue, the envelope shoots out) → "Cause diagnosed with AI". The Core is a scanning ring.
 */
export function WatchtowerChapter() {
  const watchtower = getChapter("watchtower");
  const project = getProject("staleness-agent");
  if (!project) return null;
  return (
    <section aria-labelledby="core-watchtower" className={sceneClass}>
      <h2 id="core-watchtower" className="sr-only">
        {watchtower.heading}
      </h2>
      <Beat id="watchtower.daily">
        <SplitHeading lines={coreText.watchtowerDaily} />
        <TopZone>
          <ChapterTag chapter={watchtower} />
          <HeadingLine text={coreText.watchtowerDaily[0]} className="mt-3" />
        </TopZone>
        <BottomZone>
          <HeadingLine text={coreText.watchtowerDaily[1]} accent={coreText.watchtowerDaily[1]} />
          <p className="mt-3 label-mono text-body">{project.title}</p>
        </BottomZone>
      </Beat>

      <Beat id="watchtower.stale">
        <SplitHeading lines={coreText.watchtowerStale} />
        <TopZone>
          <HeadingLine text={coreText.watchtowerStale[0]} accent="24h?" />
        </TopZone>
        <Satellites items={coreText.freshness.map((label) => ({ label }))} label={watchtower.name} />
        <BottomZone>
          <HeadingLine text={coreText.watchtowerStale[1]} />
        </BottomZone>
      </Beat>

      <Beat id="watchtower.cause">
        <SplitHeading lines={coreText.watchtowerCause} />
        <TopZone>
          <HeadingLine text={coreText.watchtowerCause[0]} />
        </TopZone>
        <BottomZone>
          <HeadingLine text={coreText.watchtowerCause[1]} accent="AI." />
          <p className="mt-3 label-mono text-body">{project.tech.filter((tech) => tech.includes("Cortex")).join(" · ")}</p>
          <CaseStudyPill slug={project.slug} />
        </BottomZone>
      </Beat>
    </section>
  );
}
