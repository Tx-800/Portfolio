import type { Metadata } from "next";
import { CorePage } from "@/components/core/CorePage";
import { DeviceSwitch } from "@/components/ui/DeviceSwitch";
import { projectsInChapter } from "@/data/content";
import { resolveHero } from "@/lib/media";

// The mobile experience. Visitors reach it at "/" (proxy.ts rewrites "/" here for phones and
// tablets), so the canonical URL is "/". Not noindex: Google's smartphone crawler gets this page for "/".
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function MobilePage() {
  // Website screenshots that exist in /public (resolved on the server, so a missing file never 404s).
  const screenshots: Record<string, string> = {};
  for (const project of projectsInChapter("websites")) {
    const hero = resolveHero(project);
    if (hero) screenshots[project.slug] = hero;
  }
  return (
    <>
      <DeviceSwitch rendered="mobile" />
      <CorePage screenshots={screenshots} />
    </>
  );
}
