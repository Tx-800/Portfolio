import { Fragment } from "react";
import { AgentsSection } from "@/components/sections/AgentsSection";
import { BootSection } from "@/components/sections/BootSection";
import { BuilderSection } from "@/components/sections/BuilderSection";
import { ChapterTransit } from "@/components/sections/ChapterTransit";
import { CockpitSection } from "@/components/sections/CockpitSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { PipelineSection } from "@/components/sections/PipelineSection";
import { SparkSection } from "@/components/sections/SparkSection";
import { WatchtowerSection } from "@/components/sections/WatchtowerSection";
import { WebsitesSection } from "@/components/sections/WebsitesSection";
import { BootOverlay } from "@/components/ui/BootOverlay";
import { ChapterNav } from "@/components/ui/ChapterNav";
import { DebugLoader } from "@/components/ui/DebugLoader";
import { DeviceSwitch } from "@/components/ui/DeviceSwitch";
import { JourneyCanvas } from "@/components/ui/JourneyCanvas";
import { ScrollEngine } from "@/components/ui/ScrollEngine";
import { ScrollReveals } from "@/components/ui/ScrollReveals";
import { projectsInChapter } from "@/data/content";
import { resolveHero } from "@/lib/media";

/** Story order. A transit gap (camera travel) sits between every pair of chapters. */
const CHAPTER_SECTIONS = [
  BootSection,
  SparkSection,
  WebsitesSection,
  CockpitSection,
  PipelineSection,
  WatchtowerSection,
  AgentsSection,
  ImpactSection,
  BuilderSection,
  ContactSection,
];

/**
 * The journey. Sections are server-rendered HTML (SEO, screen readers, no-JS); the scroll
 * engine, chapter navigation and the fixed 3D canvas behind everything are client islands.
 */
export default function JourneyPage() {
  // Website screenshots that exist on disk → textures for the 3D browser windows.
  const screenshots: Record<string, string> = {};
  for (const project of projectsInChapter("websites")) {
    const hero = resolveHero(project);
    if (hero) screenshots[project.slug] = hero;
  }

  return (
    <>
      {/* Phones get /m instead (proxy.ts); this corrects a wrong server guess in the browser. */}
      <DeviceSwitch rendered="desktop" />
      <JourneyCanvas screenshots={screenshots} />
      <ScrollEngine />
      {/* BootOverlay before ScrollReveals: reveals wait for the terminal to hand off. */}
      <BootOverlay />
      <ScrollReveals />
      <ChapterNav />
      <DebugLoader />
      {CHAPTER_SECTIONS.map((Section, i) => (
        // Static list that never reorders, so the index is a stable key.
        <Fragment key={i}>
          {i > 0 && <ChapterTransit />}
          <Section />
        </Fragment>
      ))}
    </>
  );
}
