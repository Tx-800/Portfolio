import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { buildKeyframes, sampleJourney, type Keyframe } from "@/lib/scrollMap";
import { isStageMode, STAGE_QUERY } from "@/lib/stageMode";
import { journeyStore } from "@/store/journey";
import { uiStore } from "@/store/ui";

/** Desktop: the "focus line" sits at the vertical middle of the viewport (see lib/scrollMap.ts). */
const FOCUS_LINE = 0.5;

/** Stage-mode geometry of one chapter, in document px (re-measured on every refresh). */
interface SceneBounds {
  /** Scroll position where the scene's card pins under the stage (scrub progress 0). */
  start: number;
  /** Scroll distance the card stays pinned (scrub progress 0 → 1). */
  distance: number;
  /** Long content after the pinned scene (scrolls normally; the stage slides away). */
  extraTop: number;
  extraBottom: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * The scroll engine: reads the page scroll once per frame (via ScrollTrigger, which Lenis
 * keeps in sync on desktop) and writes the journey store.
 *
 *   wheel/touch → (Lenis on desktop) → ScrollTrigger.update → update() → store
 *   → 3D camera + stations, chapter rail/bar, mobile beats and stage read the store.
 *
 * Desktop: hold while a section crosses the middle of the screen, travel in the gaps.
 *
 * Mobile "pinned stage" (stage mode): the 3D stage is fixed in the top ~55% and each chapter's
 * card pins in the bottom ~45% while its scene scrolls past.
 *   - The focus line is the stage/card boundary, so the camera flies while a transit gap
 *     crosses it.
 *   - sceneP[i] = how far chapter i's pinned scene has been scrubbed (0 → 1). Stations play
 *     their animation at that point instead of on a timer.
 *   - stageHide: while a chapter's long content (cards, lists) scrolls past, the stage slides
 *     up out of the way, and comes back before the next flight.
 */
export function useJourneyScroll(): void {
  useGSAP(() => {
    const sections = gsap.utils.toArray<HTMLElement>("[data-chapter]");
    let keyframes: Keyframe[] = [];
    let scenes: SceneBounds[] = [];
    let stage = false;
    let stageLine = 0;
    let lastHide = -1;

    const measure = () => {
      stage = isStageMode();
      const stageEl = document.getElementById("stage");
      // Height of the stage in px (CSS: 55svh). Using the element, not innerHeight, keeps the
      // triggers stable when the mobile URL bar shows or hides.
      stageLine = stage && stageEl ? stageEl.offsetHeight : 0;

      keyframes = buildKeyframes(
        sections.map((el) => {
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY;
          return { top, bottom: top + rect.height };
        }),
      );

      scenes = sections.map((el) => {
        const rect = el.getBoundingClientRect();
        const bottom = rect.top + window.scrollY + rect.height;
        const scene = el.querySelector<HTMLElement>("[data-scene]");
        const card = scene?.querySelector<HTMLElement>("[data-scene-card]");
        if (!scene || !card) return { start: 0, distance: 1, extraTop: bottom, extraBottom: bottom };
        const sceneRect = scene.getBoundingClientRect();
        const sceneTop = sceneRect.top + window.scrollY;
        // The card's sticky `top` (55svh) resolved to px: it pins when the scene top reaches it.
        const cardTop = parseFloat(getComputedStyle(card).top) || 0;
        return {
          start: sceneTop - cardTop,
          distance: Math.max(1, sceneRect.height - card.offsetHeight),
          extraTop: sceneTop + sceneRect.height,
          extraBottom: bottom,
        };
      });
    };

    const update = (scrollY: number, progress: number) => {
      const focus = scrollY + (stage ? stageLine : window.innerHeight * FOCUS_LINE);
      const sample = sampleJourney(focus, keyframes);
      const { sceneP } = journeyStore.getState();
      let hide = 0;

      if (stage) {
        scenes.forEach((scene, i) => {
          // Scrub progress of the pinned scene.
          sceneP[i] = clamp01((scrollY - scene.start) / scene.distance);

          // Long content after the scene: slide the stage away as it comes up (enter) and
          // back as its end approaches the stage line (exit), so the next flight is visible.
          if (scene.extraBottom - scene.extraTop < 80) return;
          const top = scene.extraTop - scrollY;
          const bottom = scene.extraBottom - scrollY;
          const enter = clamp01((stageLine - top) / stageLine);
          const exit = clamp01((bottom - stageLine) / stageLine);
          hide = Math.max(hide, Math.min(enter, exit));
        });
      }

      // The stage slide is a single transform write, only when it changes.
      if (Math.abs(hide - lastHide) > 0.001) {
        lastHide = hide;
        const stageEl = document.getElementById("stage");
        if (stageEl) stageEl.style.transform = stage && hide > 0 ? `translate3d(0, ${(-hide * 100).toFixed(2)}%, 0)` : "";
        // Fully hidden → the 3D can stop rendering (flag flips only at the edges).
        const hidden = hide > 0.995;
        if (uiStore.getState().stageHidden !== hidden) uiStore.setState({ stageHidden: hidden });
      }

      journeyStore.setState({
        progress,
        pathT: sample.t,
        activeIndex: sample.activeIndex,
        holding: sample.holding,
        stageMode: stage,
        stageHide: hide,
      });
    };

    // One trigger spanning the whole page: we only need its scroll position and progress.
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onRefresh: (self) => {
        measure();
        update(self.scroll(), self.progress);
      },
      onUpdate: (self) => update(self.scroll(), self.progress),
    });

    measure();
    update(window.scrollY, trigger.progress);

    // Web fonts change text heights; crossing the mobile/desktop boundary changes the layout.
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
    const media = window.matchMedia(STAGE_QUERY);
    const onModeChange = () => ScrollTrigger.refresh();
    media.addEventListener("change", onModeChange);
    return () => media.removeEventListener("change", onModeChange);
  });
}
