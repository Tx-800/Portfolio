import { AgentsChapter } from "@/components/core/chapters/AgentsChapter";
import { BuilderChapter } from "@/components/core/chapters/BuilderChapter";
import { CockpitChapter } from "@/components/core/chapters/CockpitChapter";
import { ContactChapter } from "@/components/core/chapters/ContactChapter";
import { ImpactChapter } from "@/components/core/chapters/ImpactChapter";
import { PipelineChapter } from "@/components/core/chapters/PipelineChapter";
import { SparkChapter } from "@/components/core/chapters/SparkChapter";
import { WatchtowerChapter } from "@/components/core/chapters/WatchtowerChapter";
import { WebsitesChapter } from "@/components/core/chapters/WebsitesChapter";
import { CoreChrome } from "@/components/core/CoreChrome";
import { CoreDrag } from "@/components/core/CoreDrag";
import { CoreEngine } from "@/components/core/CoreEngine";
import { TOTAL } from "@/components/core/timeline";

/**
 * Mobile "Data Core" layout: all nine chapters. Served at "/" to phones and tablets (route /m, see proxy.ts).
 *
 * Stage mode (phones, motion allowed, WebGL): a tall track with one sticky full-screen stage.
 * The Core and the fly-through space are WebGL (z-10); every beat is an HTML layer over it
 * (z-30) that CoreEngine moves in depth with the camera. Text sits only ABOVE and BELOW the
 * Core (TopZone/BottomZone are positioned from its measured radius), satellites in its corners,
 * so the Core is never covered. One file per chapter in ./chapters.
 *
 * Otherwise (reduced motion, no WebGL, desktop width): the same DOM as plain stacked sections.
 */
export function CorePage({ screenshots }: { screenshots: Record<string, string> }) {
  return (
    <div data-core className="font-display">
      <div data-core-track style={{ "--core-total": TOTAL } as React.CSSProperties} className="stage:h-[calc((var(--core-total)+1)*100svh)]">
        <div data-core-stage className="stage:sticky stage:top-0 stage:isolate stage:h-lvh stage:overflow-hidden">
          {/* Warm light from below, under everything. */}
          <div aria-hidden="true" className="absolute inset-0 z-0 hidden bg-[radial-gradient(80%_40%_at_50%_100%,color-mix(in_oklab,var(--color-accent)_18%,transparent),transparent_70%)] stage:block" />
          <CoreEngine screenshots={screenshots} />
          <CoreDrag />

          <div className="relative z-30">
            <SparkChapter />
            <WebsitesChapter />
            <CockpitChapter />
            <PipelineChapter />
            <WatchtowerChapter />
            <AgentsChapter />
            <ImpactChapter />
            <BuilderChapter />
            <ContactChapter />
          </div>

          <CoreChrome />
        </div>
      </div>
    </div>
  );
}
