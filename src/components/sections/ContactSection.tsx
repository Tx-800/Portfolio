import { ChapterSection } from "@/components/sections/ChapterSection";
import { ContactLinks } from "@/components/ui/ContactLinks";
import { getChapter } from "@/data/content";

export function ContactSection() {
  return (
    <ChapterSection chapter={getChapter("contact")} layout="left">
      <ContactLinks className="mt-8" />
    </ChapterSection>
  );
}
