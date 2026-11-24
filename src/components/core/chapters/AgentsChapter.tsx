import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { FocusPills } from "@/components/core/FocusPills";
import { caption, CaseStudyPill, ChapterTag, sceneClass } from "@/components/core/parts";
import type { StopId } from "@/components/core/timeline";
import { Txt } from "@/components/ui/Txt";
import { coreText, getChapter, getProject } from "@/data/content";

const BEATS: { id: StopId; slug: string; side: -1 | 1 }[] = [
  { id: "agents.qagent", slug: "qagent", side: -1 },
  { id: "agents.compliance", slug: "compliance-agent", side: 1 },
];

/**
 * 06 — The Agents: QAgent beat (a test report flies into the left cluster, its checks light up,
 * the reply flies out) → Compliance beat. The Core is a network with two clusters (tap to focus).
 */
export function AgentsChapter() {
  const agents = getChapter("agents");
  return (
    <section aria-labelledby="core-agents" className={sceneClass}>
      <h2 id="core-agents" className="sr-only">
        {agents.heading}
      </h2>
      {BEATS.map(({ id, slug, side }, i) => {
        const project = getProject(slug);
        if (!project) return null;
        return (
          <Beat key={id} id={id}>
            <TopZone>
              {i === 0 && <ChapterTag chapter={agents} />}
              <h3 className="mt-3 text-[clamp(2rem,9.5vw,3rem)] leading-[1] font-bold tracking-[-0.04em] text-balance text-heading">{project.title}</h3>
            </TopZone>
            <FocusPills initial={side} />
            <BottomZone>
              <p className={caption}>
                <Txt>{project.tagline}</Txt>
              </p>
              <p className="mt-2 hidden label-mono text-muted stage:block">{coreText.clusterHint}</p>
              <CaseStudyPill slug={project.slug} />
            </BottomZone>
          </Beat>
        );
      })}
    </section>
  );
}
