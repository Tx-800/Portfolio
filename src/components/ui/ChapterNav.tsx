"use client";

import { ChapterBar } from "@/components/ui/ChapterBar";
import { ChapterRail } from "@/components/ui/ChapterRail";
import { chapters } from "@/data/content";
import { useJourney } from "@/store/journey";

/**
 * Fixed chapter navigation: a rail on wide screens (xl+), a compact bottom bar below that.
 * Both are plain "#chapter" links; useAnchorLinks handles the smooth scroll + focus.
 */
export function ChapterNav() {
  // Re-renders only when the visitor crosses into another chapter.
  const activeId = useJourney((state) => chapters[state.activeIndex]?.id);

  return (
    <>
      <ChapterRail activeId={activeId} />
      <ChapterBar activeId={activeId} />
    </>
  );
}
