import type { Metadata } from "next";
import { FlowPage } from "@/components/flow/FlowPage";
import { projectsInChapter } from "@/data/content";
import { resolveHero } from "@/lib/media";

// Prototype of the mobile "flow" layout (3 chapters) for review on a real phone.
// Not linked from the site and kept out of search results until it replaces the mobile journey.
export const metadata: Metadata = {
  title: "Flow prototype",
  robots: { index: false, follow: false },
};

export default function FlowPrototypePage() {
  const screenshots: Record<string, string> = {};
  for (const project of projectsInChapter("websites")) {
    const hero = resolveHero(project);
    if (hero) screenshots[project.slug] = hero;
  }
  return <FlowPage screenshots={screenshots} />;
}
