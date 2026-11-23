import { ClassicSection } from "@/components/classic/ClassicSection";
import { ContactLinks } from "@/components/ui/ContactLinks";
import { MetricGrid } from "@/components/ui/MetricGrid";
import { SkillGroups } from "@/components/ui/SkillGroups";
import { Timeline } from "@/components/ui/Timeline";
import { experience, getChapter, skillGroups } from "@/data/content";

export function ClassicImpact() {
  const chapter = getChapter("impact");
  return (
    <ClassicSection id="impact" number="01" label="Impact" title={chapter.heading} accent={chapter.accent} intro={chapter.intro}>
      <MetricGrid />
    </ClassicSection>
  );
}

export function ClassicSkills() {
  return (
    <ClassicSection id="skills" number="03" label="Skills" title="Skills across the stack" accent="the stack">
      <SkillGroups groups={skillGroups} />
    </ClassicSection>
  );
}

export function ClassicExperience() {
  return (
    <ClassicSection id="experience" number="04" label="Experience" title="Experience">
      <Timeline items={experience} className="max-w-3xl" />
    </ClassicSection>
  );
}

export function ClassicContact() {
  const chapter = getChapter("contact");
  return (
    <ClassicSection id="contact" number="05" label="Contact" title={chapter.heading} accent={chapter.accent} intro={chapter.intro}>
      <ContactLinks />
    </ClassicSection>
  );
}
