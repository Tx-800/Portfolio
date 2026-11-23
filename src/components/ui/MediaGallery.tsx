import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { Txt } from "@/components/ui/Txt";
import type { Project } from "@/data/content";
import { resolveImage } from "@/lib/media";

/**
 * Screenshots (client work) or a flow diagram (internal tools). A screenshot whose file isn't
 * in /public yet shows a dashed placeholder naming the exact file to add; optional images
 * (NDA covers) show nothing until they exist.
 */
export function MediaGallery({ project }: { project: Project }) {
  const { flow } = project.caseStudy;
  const items = project.caseStudy.media
    .map((item) => ({ ...item, resolved: resolveImage(item.src) }))
    .filter((item) => item.kind === "diagram" || item.resolved || !item.optional);

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.caption} className={item.kind === "diagram" ? "sm:col-span-2" : undefined}>
          <figure>
            {item.kind === "diagram" ? (
              <div className="card p-6 sm:p-8" role="img" aria-label={item.alt}>
                <FlowDiagram steps={flow} />
              </div>
            ) : item.resolved ? (
              <div className="card relative aspect-[16/10] overflow-hidden">
                <Image
                  src={item.resolved}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border-strong bg-surface/50 p-6 text-center">
                <ImageIcon aria-hidden="true" className="size-6 text-muted" />
                <p className="text-[0.875rem]">
                  <Txt>{`[placeholder: add ${item.src ?? "an image"}]`}</Txt>
                </p>
              </div>
            )}
            <figcaption className="label-mono mt-3 text-muted">{item.caption}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
