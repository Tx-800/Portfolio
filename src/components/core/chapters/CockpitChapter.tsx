import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { CaseStudyPill, ChapterTag, HeadingLine, sceneClass, SplitHeading } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import { Txt } from "@/components/ui/Txt";
import { coreText, getChapter, getProject } from "@/data/content";

function ShortList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 flex flex-col gap-1 text-[1rem] leading-snug text-heading">
      {items.map((item) => (
        <li key={item}>
          <Txt>{item}</Txt>
        </li>
      ))}
    </ul>
  );
}

/** 03 — The Cockpit: "One dashboard, many businesses" → Built vs In progress. The Core is a grid of screens. */
export function CockpitChapter() {
  const cockpit = getChapter("cockpit");
  const localpilot = getProject("localpilot");
  if (!localpilot) return null;
  return (
    <section aria-labelledby="core-cockpit" className={sceneClass}>
      <SplitHeading as="h2" id="core-cockpit" lines={coreText.cockpitHeading} />
      <Beat id="cockpit.intro">
        <TopZone>
          <ChapterTag chapter={cockpit} />
          <HeadingLine text={coreText.cockpitHeading[0]} className="mt-3" />
        </TopZone>
        <Satellites items={localpilot.tech.filter((tech) => !tech.includes("(")).map((label) => ({ label }))} label={localpilot.title} />
        <BottomZone>
          <HeadingLine text={coreText.cockpitHeading[1]} accent={coreText.cockpitHeading[1]} />
          <p className="mt-3 label-mono text-body">{`${localpilot.title} · ${localpilot.context}`}</p>
        </BottomZone>
      </Beat>

      {/* Built vs In progress: always two separate lists (content rule). */}
      <Beat id="cockpit.progress">
        <TopZone>
          <p className="label-mono text-gold">{coreText.built}</p>
          <ShortList items={coreText.localpilotBuilt} />
        </TopZone>
        <BottomZone>
          <p className="label-mono text-accent">{coreText.inProgress}</p>
          <ShortList items={coreText.localpilotInProgress} />
          <CaseStudyPill slug={localpilot.slug} />
        </BottomZone>
      </Beat>
    </section>
  );
}
