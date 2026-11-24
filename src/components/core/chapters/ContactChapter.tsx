import { MailIcon } from "lucide-react";
import { Beat, BottomZone, TopZone } from "@/components/core/Beat";
import { caption, ChapterTag, HeadingLine, sceneClass } from "@/components/core/parts";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { Txt } from "@/components/ui/Txt";
import { contact, coreText, getChapter } from "@/data/content";

const pill = "pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold";

/**
 * "Let's build something" written around the envelope: an SVG circle path with the text on it,
 * slowly turning (paused for reduced motion, which never sees the stage anyway). Decorative:
 * the same words are in the page as text.
 */
function RingText({ text }: { text: string }) {
  const line = `${text} · ${text} · `.toUpperCase();
  return (
    <>
      <p className="label-mono text-gold stage:sr-only">{text}</p>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="absolute top-[50svh] left-1/2 hidden size-[calc(var(--core-r,28vw)*2.32+28px)] -translate-1/2 animate-[spin_48s_linear_infinite] stage:block"
      >
        <defs>
          <path id="core-ring-path" d="M 100,100 m -88,0 a 88,88 0 1,1 176,0 a 88,88 0 1,1 -176,0" />
        </defs>
        <text className="fill-heading font-mono text-[10.5px] font-medium tracking-[0.18em]">
          <textPath href="#core-ring-path" textLength={2 * Math.PI * 88 - 4} lengthAdjust="spacing">
            {line}
          </textPath>
        </text>
      </svg>
    </>
  );
}

/** 09 — Your Turn: the envelope (flap open) inside the ring text → it closes, sealed by the core; contact pills. */
export function ContactChapter() {
  const chapter = getChapter("contact");
  return (
    <section aria-labelledby="core-contact" className={sceneClass}>
      <Beat id="contact.build">
        <TopZone>
          <ChapterTag chapter={chapter} />
        </TopZone>
        <RingText text={coreText.contactRing} />
        <BottomZone>
          <p className={caption}>{chapter.intro}</p>
        </BottomZone>
      </Beat>

      <Beat id="contact.links">
        <h2 id="core-contact" className="sr-only">
          {chapter.heading}
        </h2>
        <TopZone>
          <HeadingLine text={chapter.heading} accent={chapter.accent} />
        </TopZone>
        <BottomZone>
          <div className="flex flex-wrap justify-center gap-2.5">
            <a href={`mailto:${contact.email}`} className={`${pill} bg-heading text-bg`}>
              <MailIcon aria-hidden="true" className="size-4" />
              {coreText.links.email}
            </a>
            {contact.github ? (
              <a href={contact.github} className={`${pill} border border-heading/30 text-heading`}>
                <GithubIcon className="size-4" />
                {coreText.links.github}
              </a>
            ) : (
              <span className={`${pill} border border-dashed border-border-strong font-normal`}>
                <Txt>{"[placeholder: GitHub URL]"}</Txt>
              </span>
            )}
            {contact.linkedin ? (
              <a href={contact.linkedin} className={`${pill} border border-heading/30 text-heading`}>
                <LinkedinIcon className="size-4" />
                {coreText.links.linkedin}
              </a>
            ) : (
              <span className={`${pill} border border-dashed border-border-strong font-normal`}>
                <Txt>{"[placeholder: LinkedIn URL]"}</Txt>
              </span>
            )}
          </div>
        </BottomZone>
      </Beat>
    </section>
  );
}
