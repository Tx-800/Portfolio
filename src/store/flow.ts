/**
 * Touch "toys" on the flow page → 3D. Plain mutable objects: the HTML controls write them in
 * their event handlers, the 3D reads them in useFrame. No React re-renders either way.
 */
export const flowInput = {
  /** Spark: drag offset of the packet in CSS px (0,0 when released → springs back). */
  spark: { x: 0, y: 0 },
  /** Websites: continuous carousel position (0 = first window … 2 = third). */
  websites: { offset: 0 },
  /** Pipeline: time (performance.now() seconds) of the last "Refresh" tap; −∞ = never. */
  pipeline: { refreshAt: Number.NEGATIVE_INFINITY },
};
