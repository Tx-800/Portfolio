import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { big, caption, ChapterTag, huge, sceneClass, struck } from "@/components/core/parts";
import type { StopId } from "@/components/core/timeline";
import { coreText, getChapter, metrics } from "@/data/content";
import { cn } from "@/lib/utils";

const metric = (id: string) => metrics.find((m) => m.id === id);

/**
 * 07 — The Impact: big typography around the Core. First beat: "MANY PEOPLE" (outline, struck
 * through) above, "ONE EMAIL" (huge, gradient) below, while the ring of people between them
 * collapses into one envelope. Then QAgent and data freshness as before → after statements.
 */
export function ImpactChapter() {
  const impact = getChapter("impact");
  const compliance = metric("compliance");
  const text = coreText.impactCompliance;
  const beats: { id: StopId; m: ReturnType<typeof metric> }[] = [
    { id: "impact.qagent", m: metric("qagent") },
    { id: "impact.freshness", m: metric("freshness") },
  ];

  return (
    <section aria-labelledby="core-impact" className={sceneClass}>
      <h2 id="core-impact" className="sr-only">
        {impact.heading}
      </h2>
      <Beat id="impact.compliance">
        {compliance && <p className="sr-only">{`${compliance.label}: ${compliance.before} → ${compliance.after}`}</p>}
        <TopZone>
          <ChapterTag chapter={impact} />
          <p className="mt-2 label-mono text-body">{text.label}</p>
          <p aria-hidden="true" className={cn("mt-3", struck)}>
            {text.before}
          </p>
          <p aria-hidden="true" className="mt-1.5 label-mono text-muted">
            {text.beforeNote}
          </p>
        </TopZone>
        <BottomZone>
          <p aria-hidden="true" className={cn(huge, "text-signature")}>
            {text.after}
          </p>
          <p className={cn("mt-3", caption)}>{text.note}</p>
        </BottomZone>
      </Beat>
      {beats.map(({ id, m }) =>
        m ? (
          <Beat key={id} id={id}>
            <TopZone>
              <p className="label-mono text-gold">{m.label}</p>
              <p className={cn("mt-2", big)}>{m.after}</p>
            </TopZone>
            <BottomZone>
              <p className={caption}>{m.note}</p>
            </BottomZone>
          </Beat>
        ) : null,
      )}
    </section>
  );
}
