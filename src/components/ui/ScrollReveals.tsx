"use client";

import { useEffect } from "react";
import { bootWillShow } from "@/components/ui/BootOverlay";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { uiStore } from "@/store/ui";

/**
 * Scroll-triggered reveals for the journey page, driven by data attributes in the HTML:
 *   data-reveal="lines" → the text is split into lines that slide up from behind a mask, one by one
 *   data-reveal="fade"  → the block fades in and rises 24px
 * Content is visible by default (no-JS, reduced motion): GSAP only sets the hidden start state
 * once it's about to animate. Waits for the boot terminal so nothing plays unseen behind it.
 */
export function ScrollReveals() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: ReturnType<typeof gsap.context> | undefined;

    const setup = () => {
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            // Re-split when fonts load or the width changes, then rebuild the animation.
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, {
                yPercent: 110,
                duration: 0.95,
                ease: "expo.out",
                stagger: 0.09,
                scrollTrigger: { trigger: el, start: "top 85%", once: true },
              }),
          });
        });
        gsap.utils.toArray<HTMLElement>('[data-reveal="fade"]').forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 24,
            duration: 0.8,
            ease: "power3.out",
            // Leave no inline transform behind (it would affect layout measuring of the cards).
            clearProps: "transform,opacity,visibility",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        });
      });
      ScrollTrigger.refresh();
    };

    if (!bootWillShow() || uiStore.getState().bootDone) {
      setup();
    } else {
      const unsubscribe = uiStore.subscribe((state) => {
        if (!state.bootDone) return;
        unsubscribe();
        setup();
      });
      return () => {
        unsubscribe();
        ctx?.revert();
      };
    }
    return () => ctx?.revert();
  }, []);

  return null;
}
