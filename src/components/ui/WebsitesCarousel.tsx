"use client";

import { useRef, type UIEvent } from "react";
import { ProjectCard } from "@/components/ui/ProjectCard";
import type { Project } from "@/data/content";
import { stageInput } from "@/store/journey";

/**
 * Mobile: swipe through the website projects. Native horizontal scroll-snap, so vertical page
 * scrolling keeps working as usual. The centred card is written to `stageInput.websitesActive`,
 * and its 3D browser window comes forward on the stage. Tapping a card opens its case study.
 */
export function WebsitesCarousel({ projects }: { projects: Project[] }) {
  const dots = useRef<HTMLSpanElement>(null);

  function onScroll(event: UIEvent<HTMLUListElement>) {
    const list = event.currentTarget;
    const item = list.firstElementChild as HTMLElement | null;
    if (!item) return;
    const step = item.offsetWidth + 12; // card width + gap-3
    const active = Math.max(0, Math.min(projects.length - 1, Math.round(list.scrollLeft / step)));
    if (active === stageInput.websitesActive) return;
    stageInput.websitesActive = active;
    dots.current?.querySelectorAll("span").forEach((dot, i) => dot.setAttribute("data-state", i === active ? "active" : "idle"));
  }

  return (
    <div className="mt-3 hidden stage:block">
      <ul
        onScroll={onScroll}
        aria-label="Website projects"
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project) => (
          <li key={project.slug} className="w-[78%] max-w-[22rem] shrink-0 snap-center">
            <ProjectCard project={project} variant="stage" compact className="p-4 sm:p-4" />
          </li>
        ))}
      </ul>
      <span ref={dots} aria-hidden="true" className="mt-2.5 flex gap-1.5">
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
