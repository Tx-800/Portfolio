import type { Metadata } from "next";
import { ClassicHero } from "@/components/classic/ClassicHero";
import {
  ClassicContact,
  ClassicExperience,
  ClassicImpact,
  ClassicSkills,
} from "@/components/classic/ClassicSections";
import { ClassicWork } from "@/components/classic/ClassicWork";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Classic view",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/classic" },
};

/** Fast, WebGL-free page with the same content as the journey. */
export default function ClassicPage() {
  return (
    <>
      <ClassicHero />
      <ClassicImpact />
      <ClassicWork />
      <ClassicSkills />
      <ClassicExperience />
      <ClassicContact />
    </>
  );
}
