/**
 * Scroll → camera mapping with HOLD ZONES.
 *
 * The journey page is a stack of alternating blocks:
 *
 *   [Boot section] [transit] [Spark section] [transit] [Websites section] … [Contact section]
 *
 * We follow a "focus line": the vertical middle of the viewport, in document pixels.
 *
 *   - Focus line inside a chapter section → HOLD. The camera stays at that chapter's
 *     station, so the panel can be read while it scrolls past.
 *   - Focus line inside a transit gap → TRAVEL. The camera eases from the previous
 *     station to the next one.
 *
 * Every section contributes two keyframes, (section top, station t) and
 * (section bottom, station t). Between neighbouring keyframes we interpolate:
 * the same t on both ends means a hold, different t values mean travel.
 *
 *   focus px:  top0 ──── bottom0 ~~~~~~~~ top1 ──── bottom1 ~~~~~~~~ top2 …
 *   path t:    t0 ─ hold ─ t0   ↗ travel ↗  t1 ─ hold ─ t1   ↗ travel ↗  t2 …
 *
 * Everything here is pure math (no DOM), so it's easy to test and reason about.
 */

export interface SectionBounds {
  /** Document-space top of the chapter section, in px. */
  top: number;
  /** Document-space bottom of the chapter section, in px. */
  bottom: number;
}

export interface Keyframe {
  /** Focus-line position (document px) where this keyframe applies. */
  at: number;
  /** Position along the camera path, 0 → 1. */
  t: number;
  /** Index of the chapter this keyframe belongs to. */
  index: number;
}

export interface JourneySample {
  /** Camera position along the path, 0 → 1 (hold zones applied, eased). */
  t: number;
  /** Chapter the visitor is "at": switches halfway through each transit. */
  activeIndex: number;
  /** True while the camera is parked at a station. */
  holding: boolean;
}

/**
 * Stations are spread evenly in path-parameter space: chapter i of n sits at t = i / (n - 1).
 * This matches CatmullRomCurve3.getPoint(t), which passes through control point i at exactly
 * that t (see components/three/path.ts).
 */
export function stationT(index: number, count: number): number {
  return count <= 1 ? 0 : index / (count - 1);
}

export function buildKeyframes(sections: SectionBounds[]): Keyframe[] {
  return sections.flatMap((section, index) => {
    const t = stationT(index, sections.length);
    return [
      { at: section.top, t, index },
      { at: section.bottom, t, index },
    ];
  });
}

/** Slow start, slow end: the camera eases out of one station and settles into the next. */
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
}

export function sampleJourney(focus: number, keyframes: Keyframe[]): JourneySample {
  if (keyframes.length === 0) return { t: 0, activeIndex: 0, holding: true };

  const first = keyframes[0];
  const last = keyframes[keyframes.length - 1];
  // Above the first section or below the last one: park at the first/last station.
  if (focus <= first.at) return { t: first.t, activeIndex: first.index, holding: true };
  if (focus >= last.at) return { t: last.t, activeIndex: last.index, holding: true };

  // Find the pair of keyframes [a, b] that surrounds the focus line.
  let i = 0;
  while (i < keyframes.length - 2 && focus > keyframes[i + 1].at) i++;
  const a = keyframes[i];
  const b = keyframes[i + 1];

  // Same station on both sides → we're inside a section: hold.
  if (a.t === b.t) return { t: a.t, activeIndex: a.index, holding: true };

  // Different stations → we're in a transit gap: travel with easing.
  const local = (focus - a.at) / Math.max(1, b.at - a.at);
  return {
    t: a.t + (b.t - a.t) * easeInOutCubic(local),
    activeIndex: local < 0.5 ? a.index : b.index,
    holding: false,
  };
}
