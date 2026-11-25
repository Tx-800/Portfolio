import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { caption, CaseStudyPill, ChapterTag, sceneClass } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import type { StopId } from "@/components/core/timeline";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Txt } from "@/components/ui/Txt";
import { coreText, getChapter, projectsInChapter } from "@/data/content";
import { cn } from "@/lib/utils";

const SITE_STOPS: StopId[] = ["websites.0", "websites.1", "websites.2"];

/** 02 — Where Data Is Born: one beat per website; the Core is a browser window. */
export function WebsitesChapter() {
  const websites = getChapter("websites");
  return (
    <section id="websites" aria-labelledby="core-websites" className={sceneClass}>
      <h2 id="core-websites" className="sr-only">
        {websites.heading}
      </h2>
      {projectsInChapter("websites").map((site, i) => (
        <Beat key={site.slug} id={SITE_STOPS[i]}>
          <TopZone>
            <ChapterTag chapter={websites} />
            <h3 className="mt-3 text-[clamp(1.75rem,8vw,2.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-heading">{site.title}</h3>
            <p className="mt-2 label-mono text-body">{[site.context, site.date].filter(Boolean).join(" · ")}</p>
          </TopZone>
          <Satellites items={coreText.siteSatellites[site.slug] ?? []} label={site.title} />
          <BottomZone>
            <StatusBadge status={site.status} />
            <p className={cn("mt-2.5", caption)}>
              <Txt>{site.tagline}</Txt>
            </p>
            <CaseStudyPill slug={site.slug} />
          </BottomZone>
        </Beat>
      ))}
    </section>
  );
}
