import { ArrowDownIcon } from "lucide-react";
import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { big, caption, ChapterTag, HeadingLine, sceneClass } from "@/components/core/parts";
import { Satellites } from "@/components/core/Satellites";
import { coreText, getChapter, profile } from "@/data/content";
import { cn } from "@/lib/utils";

/** 01 — The Spark: name → headline (split around the orb) → "Scroll to follow the data". */
export function SparkChapter() {
  const spark = getChapter("spark");
  const comma = profile.headline.indexOf(",");
  const [headA, headB] = [profile.headline.slice(0, comma + 1), profile.headline.slice(comma + 2)];

  return (
    <section aria-labelledby="core-name" className={sceneClass}>
      <Beat id="spark.name">
        <TopZone>
          <ChapterTag chapter={spark} />
          <h1 id="core-name" className={cn("mt-3", big)}>
            {profile.name}
          </h1>
          <p className="mt-2 label-mono text-body">{profile.role}</p>
        </TopZone>
        <Satellites items={coreText.sparkSatellites.map((label) => ({ label }))} label={profile.role} />
        <BottomZone>
          <p className={caption}>{profile.focus}</p>
          <p className="mt-3 hidden label-mono text-muted stage:block">{coreText.dragHint}</p>
        </BottomZone>
      </Beat>

      <Beat id="spark.headline">
        <p className="sr-only">{profile.headline}</p>
        <TopZone>
          {/* Hyphenated words ("full-stack") never break at the hyphen. */}
          <p aria-hidden="true" className={big}>
            {headA.split(" ").map((word, i) => (
              <span key={i} className={word.includes("-") ? "whitespace-nowrap" : undefined}>
                {i > 0 && " "}
                {word}
              </span>
            ))}
          </p>
        </TopZone>
        <BottomZone>
          <HeadingLine text={headB} accent={profile.headlineAccent} />
        </BottomZone>
      </Beat>

      <Beat id="spark.follow">
        <TopZone>
          <p className={caption}>{spark.beats?.[1]}</p>
        </TopZone>
        <BottomZone>
          <p className="inline-flex items-center gap-2 label-mono text-heading">
            {spark.beats?.[2]}
            <ArrowDownIcon aria-hidden="true" className="size-3.5" />
          </p>
        </BottomZone>
      </Beat>
    </section>
  );
}
