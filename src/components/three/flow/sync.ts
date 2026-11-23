import { Vector3 } from "three";

/**
 * DOM-ANCHORED 3D WITH NATIVE SCROLL (after Lusion's WebGL-Scroll-Sync)
 * =====================================================================
 *
 * The problem: on phones, page scrolling runs on the compositor thread, while WebGL renders in
 * requestAnimationFrame on the main thread. A `position: fixed` canvas that redraws 3D objects at
 * their anchors' new positions is always one frame (or more) late, so objects visibly drift or
 * lag behind the text they belong to.
 *
 * The trick:
 *   1. The canvas is `position: absolute` INSIDE the page (not fixed), so native scrolling moves
 *      it together with the text. Between our frames, canvas and anchors move in perfect sync:
 *      no drift, because the browser scrolls both in the same composite.
 *   2. Every frame we push the canvas back to cover the viewport:
 *        transform = translateY(scrollY − pageTop − pad)
 *      and draw each object at its anchor's position for that same scrollY.
 *   3. While the browser scrolls ahead of our next frame, the canvas edge would slide into
 *      view. So the canvas is 1.5 × the viewport tall: 25% padding above and below hides
 *      that edge during fast flicks (clipping is far less noticeable than drift).
 *
 * Coordinates: one world unit = one CSS pixel. The camera looks at the centre of the canvas,
 * placed so that z = 0 maps 1:1 to the screen (see FlowCamera). A point at document position
 * (docX, docY) is drawn at world
 *     x = docX − viewportWidth / 2
 *     y = canvasCentreInViewport − (docY − scrollY)
 * where the canvas centre sits at a constant viewport y (it's always −pad + canvasHeight / 2).
 *
 * Anchor rectangles are measured ONCE in document coordinates (on resize, font load or layout
 * change via ResizeObserver), never per frame: per frame only window.scrollY is read.
 */

/** An anchor's box in document coordinates (CSS px, relative to the page). */
export interface AnchorBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Shared per-frame sync state. Written by FlowSync (first useFrame), read by everything else. */
export const flow = {
  /** window.scrollY for the frame being rendered. */
  scrollY: 0,
  /** Viewport (layout) width and current visible height. */
  vw: 0,
  vh: 0,
  /** Canvas height (1.5 × the large viewport height) and the 25% padding above it. */
  canvasH: 0,
  pad: 0,
  /** Document y of the page wrapper the canvas is positioned in. */
  rootTop: 0,
  /** Measured anchors by id (data-anchor="…"). */
  anchors: new Map<string, AnchorBox>(),
  /** Prefers-reduced-motion: no flights or idle animation, stations show their final state. */
  reduced: false,
  /** The absolutely positioned element wrapping the canvas (moved every frame). */
  wrapper: null as HTMLDivElement | null,
};

/** Re-measures every [data-anchor] inside `root` into document coordinates. */
export function measureAnchors(root: HTMLElement): void {
  const scrollY = window.scrollY;
  flow.anchors.clear();
  root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const id = el.dataset.anchor;
    if (id) flow.anchors.set(id, { x: rect.left + window.scrollX, y: rect.top + scrollY, w: rect.width, h: rect.height });
  });
  const rootRect = root.getBoundingClientRect();
  flow.rootTop = rootRect.top + scrollY;
}

/** Document position → world position (z = 0 plane) for the current frame. */
export function docToWorld(docX: number, docY: number, out: Vector3): Vector3 {
  // The canvas top is always at viewport y = −pad, so its centre is at −pad + canvasH / 2.
  const canvasCentre = -flow.pad + flow.canvasH / 2;
  return out.set(docX - flow.vw / 2, canvasCentre - (docY - flow.scrollY), 0);
}

/** Is the anchor (with some margin) inside the canvas this frame? Used to cull stations. */
export function anchorNearView(box: AnchorBox, margin = 0): boolean {
  const top = box.y - flow.scrollY;
  return top + box.h > -flow.pad - margin && top < flow.vh + flow.pad + margin;
}

/**
 * How "settled" an anchor is: 1 when its centre is at the viewport centre, falling to 0 as it
 * moves a viewport height away. Stations use it to arrive (scale/rise in) and leave.
 */
export function anchorSettle(box: AnchorBox): number {
  const centre = box.y + box.h / 2 - flow.scrollY;
  const d = Math.abs(centre - flow.vh / 2) / (flow.vh * 0.85);
  return Math.max(0, 1 - d);
}
