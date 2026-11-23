import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export type CursorHint = "drag" | null;

export interface UiState {
  /** The 3D scene rendered its first frame. */
  sceneReady: boolean;
  /** The boot terminal overlay is on screen (page scroll is frozen). */
  bootOpen: boolean;
  /** The boot terminal has handed off to the journey (or was never shown). */
  bootDone: boolean;
  /** A case-study overlay covers the page: the 3D pauses rendering. */
  overlayOpen: boolean;
  /** Mobile stage has slid fully out of view (long content scrolling): the 3D pauses. */
  stageHidden: boolean;
  /** Set by the 3D scene (e.g. hovering the skill sphere) to change the custom cursor. */
  cursorHint: CursorHint;
}

export const uiStore = createStore<UiState>(() => ({
  sceneReady: false,
  bootOpen: false,
  bootDone: false,
  overlayOpen: false,
  stageHidden: false,
  cursorHint: null,
}));

export function useUi<T>(selector: (state: UiState) => T): T {
  return useStore(uiStore, selector);
}
