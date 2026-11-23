import { ChapterSection } from "@/components/sections/ChapterSection";
import { SkillGroups } from "@/components/ui/SkillGroups";
import { Timeline } from "@/components/ui/Timeline";
import { experience, getChapter, skillGroups } from "@/data/content";

export function BuilderSection() {
  return (
    <ChapterSection chapter={getChapter("builder")} layout="wide">
      <SkillGroups groups={skillGroups} />
      <div className="panel mt-6 p-6 sm:p-10 md:mt-8">
        <h3 className="label-mono text-gold">Experience</h3>
        <Timeline items={experience} className="mt-8 max-w-3xl" />
      </div>
    </ChapterSection>
  );
}
