import { ChapterSection } from "@/components/sections/ChapterSection";
import { MetricBeats } from "@/components/ui/MetricBeats";
import { MetricGrid } from "@/components/ui/MetricGrid";
import { chapters, getChapter, metrics } from "@/data/content";

export function ImpactSection() {
  const index = chapters.findIndex((c) => c.id === "impact");
  return (
    <ChapterSection chapter={getChapter("impact")} layout="wide" stageContent={<MetricBeats index={index} metrics={metrics} />}>
      {/* Desktop tiles; on phones the metrics count up inside the pinned card instead. */}
      <div className="stage:hidden">
        <MetricGrid />
      </div>
    </ChapterSection>
  );
}
