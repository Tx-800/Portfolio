import type Lenis from "lenis";
import { isStageMode } from "@/lib/stageMode";

/** Height of the sticky header (h-16). Scroll targets land just below it. */
export const HEADER_OFFSET = 64;

/**
 * Scrolls to an element with Lenis when it's running (smooth, synced with the 3D), or natively
 * otherwise. Then moves focus there so keyboard and screen-reader users land in the same place.
 */
export function scrollToElement(el: HTMLElement, lenis?: Lenis, duration = 1.4): void {
  // Mobile stage: land a chapter's top on the stage line, i.e. the start of its pinned scene
  // (scrub progress 0), so its story plays from the beginning.
  const stage = document.getElementById("stage");
  const offset = isStageMode() && stage && el.matches("[data-chapter]") ? stage.offsetHeight : HEADER_OFFSET;

  if (lenis) {
    lenis.scrollTo(el, { offset: -offset, duration });
  } else {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  }

  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}
