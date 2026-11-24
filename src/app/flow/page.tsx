import type { Metadata } from "next";
import { CorePage } from "@/components/core/CorePage";
import { projectsInChapter } from "@/data/content";
import { resolveHero } from "@/lib/media";

// Prototype of the mobile "Data Core" layout (chapters 1–3) for review on a real phone.
// Not linked from the site and kept out of search results until it replaces the mobile journey.
export const metadata: Metadata = {
  title: "Mobile prototype",
  robots: { index: false, follow: false },
};

export default function CorePrototypePage() {
  // Website screenshots that exist in /public (resolved on the server, so a missing file never 404s).
  const screenshots: Record<string, string> = {};
  for (const project of projectsInChapter("websites")) {
    const hero = resolveHero(project);
    if (hero) screenshots[project.slug] = hero;
  }
  return <CorePage screenshots={screenshots} />;
}
