"use client";

import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useRef, type UIEvent } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { flowText, type Project } from "@/data/content";
import { flowInput } from "@/store/flow";

/**
 * Swipe layer over the Websites 3D slot: a native horizontal scroll-snap strip with one
 * full-width slide per website. Its continuous position (scrollLeft / slide width = 0…2) drives
 * the 3D windows (FlowWebsites). Vertical page scrolling is untouched. Each slide carries the
 * project's name and a link to its case study at the bottom of the slot.
 */
export function WebsitesStrip({ projects }: { projects: Project[] }) {
  const dots = useRef<HTMLSpanElement>(null);

  function onScroll(e: UIEvent<HTMLUListElement>) {
    const list = e.currentTarget;
    const offset = list.scrollLeft / Math.max(1, list.clientWidth);
    flowInput.websites.offset = offset;
    const active = Math.round(offset);
    dots.current?.querySelectorAll("span").forEach((dot, i) => dot.setAttribute("data-state", i === active ? "active" : "idle"));
  }

  return (
    <div className="absolute inset-0">
      <ul
        onScroll={onScroll}
        aria-label={flowText.websitesHint}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => (
          <li key={project.slug} className="flex h-full w-full shrink-0 snap-center flex-col justify-end px-4 pb-10 sm:px-6">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <StatusBadge status={project.status} />
                <p className="mt-2 truncate text-[1.25rem] font-semibold text-heading">{project.title}</p>
              </div>
              <Link
                href={`/work/${project.slug}`}
                scroll={false}
                prefetch
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-bg/60 px-4 text-[0.875rem] font-semibold text-heading backdrop-blur"
              >
                {flowText.openCaseStudy}
                <ArrowUpRightIcon aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <span ref={dots} aria-hidden="true" className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {projects.map((project, i) => (
          <span
            key={project.slug}
            data-state={i === 0 ? "active" : "idle"}
            className="h-1 w-4 rounded-full bg-border-strong transition-[background-color,width] duration-300 data-[state=active]:bg-signature data-[state=active]:w-8"
          />
        ))}
      </span>
    </div>
  );
}
