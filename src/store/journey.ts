import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { chapters } from "@/data/content";

export interface JourneyState {
  /** Raw page scroll, 0 → 1. */
  progress: number;
  /** Camera position along the path, 0 → 1, with hold zones applied. */
  pathT: number;
  /** Index into `chapters` (content.ts) of the chapter the visitor is at. */
  activeIndex: number;
  /** True while the camera is parked at a station (panel readable). */
  holding: boolean;
  /** Mobile "pinned stage" layout is active (see lib/stageMode.ts). */
  stageMode: boolean;
  /**
   * Stage mode only: how far each chapter's pinned scene has been scrubbed, 0 → 1, indexed like
   * `chapters`. Chapters before the visitor read 1, chapters after read 0. Mutated in place by
   * the scroll engine every frame (same array object), so reading it never re-renders React.
   */
  sceneP: Float32Array;
  /** Stage mode only: 0 = stage visible, 1 = slid away while long content scrolls past. */
  stageHide: number;
}

/**
 * Vanilla store so per-frame code can read it without React:
 *   - 3D (useFrame) and DOM effects: `journeyStore.getState()` or `journeyStore.subscribe(...)`
 *   - React UI: `useJourney(selector)`; it re-renders only when the selected value changes,
 *     so selecting `activeIndex` re-renders once per chapter, not on every scroll frame.
 */
export const journeyStore = createStore<JourneyState>(() => ({
  progress: 0,
  pathT: 0,
  activeIndex: 0,
  holding: true,
  stageMode: false,
  sceneP: new Float32Array(chapters.length),
  stageHide: 0,
}));

export function useJourney<T>(selector: (state: JourneyState) => T): T {
  return useStore(journeyStore, selector);
}

/** Scrubbed scene progress of chapter `index` (stage mode), or null on desktop. */
export function sceneProgress(index: number): number | null {
  const { stageMode, sceneP } = journeyStore.getState();
  return stageMode ? sceneP[index] : null;
}

/** Touch-driven state shared between the mobile HTML and the 3D (no React re-renders). */
export const stageInput = {
  /** Index of the website card centred in the mobile carousel. */
  websitesActive: 0,
};
