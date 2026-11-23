import { useLenis } from "lenis/react";
import { useEffect } from "react";
import { scrollToElement } from "@/lib/scrollTo";

/**
 * Routes every in-page "#id" link (header CTA, chapter rail, "Start the journey"…) through
 * scrollToElement, so smooth scrolling, the header offset and focus handling are the same
 * everywhere. One delegated listener instead of an onClick on every link.
 */
export function useAnchorLinks(): void {
  // Outside a <ReactLenis> provider this reads the root instance; undefined when Lenis is off.
  const lenis = useLenis();

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.origin !== window.location.origin || link.pathname !== window.location.pathname || !link.hash) return;

      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;

      event.preventDefault();
      history.replaceState(null, "", link.hash);
      // Inside an overlay (its own scroll container) scroll that container, not the frozen page.
      if (target.closest("[data-lenis-prevent]")) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        return;
      }
      scrollToElement(target, lenis);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [lenis]);
}
