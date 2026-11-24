/**
 * THE DATA CORE — MASTER TIMELINE (mobile)
 * ========================================
 *
 * One number drives everything: `t`, the scroll position measured in SCREENS (one viewport
 * height of scrolling = 1). The page is just a tall track; a sticky full-screen stage inside it
 * holds the WebGL canvas and the HTML overlay. A GSAP ScrollTrigger turns the scroll position
 * into t (scrubbed, so it glides), and ONE ticker callback per frame updates the overlay and
 * renders the 3D from that same t (CoreEngine). They can't drift apart.
 *
 * FLYING FORWARD
 * --------------
 * t (screens scrolled) is turned into `s`, the DISTANCE travelled through space (in "legs";
 * one leg = the gap between two content beats). The journey is a list of STOPS. At each stop
 * the viewer HOLDS (s barely moves while you scroll, so the text there sits still and is
 * readable), then TRAVELS to the next stop (s eases forward: slow → fast → slow). A chapter
 * starts with a longer leg that flies through a GATE, a ring of light, where the Core morphs.
 *
 *    t: |hold|──travel──|hold|──travel──|hold|════gate travel════|hold| …
 *    s:  ─── creeps ───╱ eases ╲── creeps ─── … ─────╱  passes the gate ╲───
 *
 * The 3D camera sits at depth s · WORLD_PER_LEG; content beats are "anchored" at their stop's
 * s. How far a beat is from the viewer (r = s − anchor) decides where it is drawn:
 *    r < 0  ahead: small, dim, blurred, approaching
 *    r ≈ 0  settled around the Core (the hold)
 *    r > 0  passing the viewer: growing, blurring, fading out
 *
 * Every moment of the story is a number in this file.
 */

export type ChapterKey = "spark" | "websites" | "cockpit" | "pipeline" | "watchtower" | "agents" | "impact" | "builder" | "contact";

interface StopDef {
  id: string;
  chapter: ChapterKey;
  /** Screens of scrolling to travel here from the previous stop. */
  travel: number;
  /** Distance (legs) of that travel. */
  legs: number;
  /** Screens of scrolling the beat holds still. */
  hold: number;
  /** This travel passes through a gate (the start of a chapter). */
  gate?: boolean;
}

const STOP_DEFS = [
  { id: "spark.name", chapter: "spark", travel: 0, legs: 0, hold: 0.55 },
  { id: "spark.headline", chapter: "spark", travel: 0.6, legs: 1, hold: 0.6 },
  { id: "spark.follow", chapter: "spark", travel: 0.6, legs: 1, hold: 0.5 },
  { id: "websites.0", chapter: "websites", travel: 1.0, legs: 1.6, hold: 0.6, gate: true },
  { id: "websites.1", chapter: "websites", travel: 0.6, legs: 1, hold: 0.6 },
  { id: "websites.2", chapter: "websites", travel: 0.6, legs: 1, hold: 0.6 },
  { id: "cockpit.intro", chapter: "cockpit", travel: 1.0, legs: 1.6, hold: 0.6, gate: true },
  { id: "cockpit.progress", chapter: "cockpit", travel: 0.6, legs: 1, hold: 0.8 },
  { id: "pipeline.intro", chapter: "pipeline", travel: 1.0, legs: 1.6, hold: 0.6, gate: true },
  { id: "pipeline.flow", chapter: "pipeline", travel: 0.6, legs: 1, hold: 0.7 },
  { id: "watchtower.daily", chapter: "watchtower", travel: 1.0, legs: 1.6, hold: 0.55, gate: true },
  { id: "watchtower.stale", chapter: "watchtower", travel: 0.6, legs: 1, hold: 0.7 },
  { id: "watchtower.cause", chapter: "watchtower", travel: 0.6, legs: 1, hold: 0.6 },
  { id: "agents.qagent", chapter: "agents", travel: 1.0, legs: 1.6, hold: 0.8, gate: true },
  { id: "agents.compliance", chapter: "agents", travel: 0.6, legs: 1, hold: 0.7 },
  { id: "impact.compliance", chapter: "impact", travel: 1.0, legs: 1.6, hold: 0.7, gate: true },
  { id: "impact.qagent", chapter: "impact", travel: 0.6, legs: 1, hold: 0.55 },
  { id: "impact.freshness", chapter: "impact", travel: 0.6, legs: 1, hold: 0.55 },
  { id: "builder.skills", chapter: "builder", travel: 1.0, legs: 1.6, hold: 0.8, gate: true },
  { id: "builder.role", chapter: "builder", travel: 0.6, legs: 1, hold: 0.55 },
  { id: "builder.freelance", chapter: "builder", travel: 0.6, legs: 1, hold: 0.55 },
  { id: "builder.portfolio", chapter: "builder", travel: 0.6, legs: 1, hold: 0.55 },
  { id: "contact.build", chapter: "contact", travel: 1.0, legs: 1.6, hold: 0.6, gate: true },
  { id: "contact.links", chapter: "contact", travel: 0.6, legs: 1, hold: 0.9 },
] as const satisfies readonly StopDef[];

export type StopId = (typeof STOP_DEFS)[number]["id"];

/** While holding, the viewer still creeps forward a little, so nothing looks frozen. */
const CREEP = 0.05;
/** Extra scroll after the last hold, before the stage scrolls away. */
const TAIL = 0.3;

export interface Stop {
  id: StopId;
  chapter: ChapterKey;
  /** Hold window in t (screens). */
  t0: number;
  t1: number;
  /** Distance at the start of the hold; the beat's anchor is the middle of the hold. */
  s0: number;
  anchor: number;
  /** Travel into this stop: [t start, t end] and the distance at its start. */
  travelT: [number, number];
  travelS0: number;
  gate: boolean;
}

/** Lay the stops out on the t axis and the s axis. */
export const STOPS: Stop[] = (() => {
  const out: Stop[] = [];
  let t = 0;
  let s = 0;
  for (const def of STOP_DEFS) {
    const travelT: [number, number] = [t, t + def.travel];
    const travelS0 = s;
    t += def.travel;
    s += def.legs;
    out.push({ id: def.id, chapter: def.chapter, t0: t, t1: t + def.hold, s0: s, anchor: s + CREEP / 2, travelT, travelS0, gate: "gate" in def && def.gate });
    t += def.hold;
    s += CREEP;
  }
  return out;
})();

export const TOTAL = STOPS[STOPS.length - 1].t1 + TAIL;

/** Each gate: where it stands (s) and when the viewer flies through it (t). Halfway into its travel. */
export const GATES = STOPS.filter((stop) => stop.gate).map((stop) => ({
  chapter: stop.chapter,
  s: (stop.travelS0 + stop.s0) / 2,
  t: (stop.travelT[0] + stop.travelT[1]) / 2,
}));

/** First stop of each chapter (menu jumps, progress counter). */
export const CHAPTERS: ChapterKey[] = ["spark", "websites", "cockpit", "pipeline", "watchtower", "agents", "impact", "builder", "contact"];
export const chapterStart = (key: ChapterKey) => STOPS.find((stop) => stop.chapter === key) as Stop;
const stop = (id: StopId) => STOPS.find((s) => s.id === id) as Stop;
const lastOf = (key: ChapterKey) => STOPS.findLast((s) => s.chapter === key) as Stop;

/* ------------------------------------------------------------------ easing helpers */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0 before a, 1 after b, linear in between. */
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
/** Smooth S-curve (ease-in-out) of a 0→1 value. */
export const smooth = (x: number) => x * x * (3 - 2 * x);

/* ------------------------------------------------------------------ t → everything */

/**
 * Distance travelled at time t. Holds: linear creep. Travels: an S-curve, so the speed rises
 * and falls smoothly (the tunnel streaks stretch with that speed).
 */
export function distanceAt(t: number): number {
  let s = 0;
  for (const stop of STOPS) {
    if (t < stop.travelT[1]) {
      const k = smooth(ramp(t, stop.travelT[0], stop.travelT[1]));
      return stop.travelS0 + (stop.s0 - stop.travelS0) * k;
    }
    if (t < stop.t1) return stop.s0 + CREEP * ramp(t, stop.t0, stop.t1);
    s = stop.s0 + CREEP;
  }
  return s;
}

/**
 * The Core's shape at time t, as a continuous number: 0 orb · 1 browser · 2 screen grid ·
 * 3 crystal cube · 4 scanning ring · 5 agent network · 6 many → one · 7 skill globe · 8 envelope.
 * It steps up by one around each gate (x.5 = halfway through a morph).
 */
export const MORPH_HALF = 0.32;
export function morphAt(t: number): number {
  return GATES.reduce((m, gate) => m + smooth(ramp(t, gate.t - MORPH_HALF, gate.t + MORPH_HALF)), 0);
}

/** Which website the browser Core is showing (0 → 2, continuous during the travels between them). */
export function siteAt(t: number): number {
  return STOPS.filter((s) => s.chapter === "websites" && !s.gate).reduce((sum, s) => sum + smooth(ramp(t, s.travelT[0], s.travelT[1])), 0);
}

/**
 * Per-shape effects, all scrubbed by scroll (0 → 1 unless noted). The shader applies each one
 * only while the Core is (morphing into) that shape.
 */
export interface CoreEffects {
  /** Grid: screens lit, 0 → 9. */
  lit: number;
  /** Cube: the refresh layer sweeping bottom → top. */
  sweep: number;
  /** Scanning ring: one table turns stale (cold blue)… */
  stale: number;
  /** …and the alert envelope shoots out of it. */
  envelope: number;
  /** Network: −1 = QAgent cluster in focus, +1 = Compliance. */
  focus: number;
  /** QAgent: a test report flies in (0 → .3), its checks light up (→ .6), the reply flies out (→ 1). */
  report: number;
  /** Many → one: the ring of people (+ a developer) collapses into one email. */
  collapse: number;
  /** Envelope: the flap closes and the seal lights up. */
  flap: number;
}

export function effectsAt(t: number): CoreEffects {
  const cockpit = chapterStart("cockpit");
  const pipeline = chapterStart("pipeline");
  const stale = stop("watchtower.stale");
  const qagent = stop("agents.qagent");
  const compliance = stop("agents.compliance");
  const impact = chapterStart("impact");
  const links = stop("contact.links");
  return {
    lit: ramp(t, cockpit.t0 - 0.15, lastOf("cockpit").t1 - 0.1) * 9,
    sweep: ramp(t, pipeline.t0, lastOf("pipeline").t1),
    stale: smooth(ramp(t, stale.travelT[0] + 0.2, stale.t0 + 0.1)),
    envelope: ramp(t, stale.t0 + 0.15, stale.t1 + 0.35),
    focus: -1 + 2 * smooth(ramp(t, compliance.travelT[0], compliance.travelT[1])),
    report: ramp(t, qagent.t0 - 0.2, qagent.t1),
    collapse: smooth(ramp(t, impact.t0 - 0.1, impact.t0 + 0.45)),
    flap: smooth(ramp(t, links.travelT[0], links.t0)),
  };
}

/**
 * How a beat looks at distance r from its anchor (r = s − anchor, in legs).
 * Approaching (r < 0): fades in from r = −0.95, sharp by r = −0.15.
 * Passing (r > 0): fades out by r = +0.42 while it grows past the viewer.
 * A hold keeps |r| ≤ CREEP / 2, so the beat is fully visible and sharp the whole time.
 */
export function beatLook(r: number): { opacity: number; blur: number } {
  if (r < 0) return { opacity: smooth(ramp(r, -0.95, -0.2)), blur: (1 - ramp(r, -0.9, -0.15)) * 7 };
  return { opacity: 1 - smooth(ramp(r, 0.06, 0.42)), blur: ramp(r, 0.08, 0.4) * 6 };
}

/* ------------------------------------------------------------------ the shared view */

/** World units the camera moves per leg. */
export const WORLD_PER_LEG = 12;
/** Vertical field of view of the 3D camera (degrees). */
export const FOV = 40;
/** The Core's radius in world units (every shape is modelled around it). */
export const CORE_R = 1;
/** The Core's diameter as a share of the screen width, and its cap as a share of the visible height. */
const CORE_W = 0.56;
const CORE_H = 0.3;

/**
 * Per-frame state shared by the engine (writer) and the 3D scene (reader). Plain mutable data:
 * reading it in useFrame never re-renders React.
 */
export const core = {
  t: 0,
  /** Distance travelled (legs) and its speed (legs / s, smoothed). */
  s: 0,
  speed: 0,
  /** Canvas size (px; the canvas is 100lvh) and the visible height (window.innerHeight). */
  width: 1,
  canvasH: 1,
  visibleH: 1,
  /** Camera → Core distance (world) and the camera's focal length in CSS px. */
  coreDist: 10,
  focalPx: 1000,
  /** The Core's radius on screen, px, and where the 3D actually drew its centre (screen px). */
  coreRadiusPx: 100,
  projected: { x: 0, y: 0 },
  /** Touch drag on the Core (radians), written by CoreDrag; the 3D springs back to 0. */
  drag: { x: 0, y: 0, active: false },
  /** Agents: a cluster the visitor tapped (−1 / +1) overrides the scroll-driven focus; null = none. */
  focusOverride: null as number | null,
  menuOpen: false,
  render: null as ((time: number) => void) | null,
};

/**
 * Fit the Core to the screen. With a vertical field of view `fov`, the world height visible at
 * distance d is 2·d·tan(fov/2) (= d·tan2), and its width is that × the canvas aspect. The Core
 * (diameter 2r) should take CORE_W of the width but at most CORE_H of the VISIBLE height:
 *     d = 2r / (CORE_W · tan2 · aspect)        (width)
 *     d = 2r / (CORE_H · tan2 · visible/canvas) (height cap) → take the larger distance.
 * The focal length in px (how many px one world unit spans at distance 1) is canvasH / tan2.
 */
export function measureView(width: number, canvasH: number, visibleH: number): void {
  const tan2 = 2 * Math.tan(((FOV / 2) * Math.PI) / 180);
  const d = Math.max((2 * CORE_R) / (CORE_W * tan2 * (width / canvasH)), (2 * CORE_R) / (CORE_H * tan2 * (visibleH / canvasH)));
  core.width = width;
  core.canvasH = canvasH;
  core.visibleH = visibleH;
  core.coreDist = d;
  core.focalPx = canvasH / tan2;
  core.coreRadiusPx = (CORE_R / d) * core.focalPx;
}

/**
 * OVERLAY ↔ 3D SYNC
 * -----------------
 * The HTML beats use CSS `perspective(P) translateZ(z)` with P = the camera's focal length in px
 * and the perspective origin at the Core's centre. CSS scales an element at translateZ(z) by
 * P / (P − z); the 3D camera scales an object at distance d by 1/d. A beat "lives" on the
 * Core's plane (distance coreDist when settled); at distance r legs from its anchor it is
 * coreDist − r·WORLD_PER_LEG away. Equating the two scales gives
 *     z = P · r · WORLD_PER_LEG / coreDist   (px)
 * so the text approaches and passes exactly like a real object in the 3D scene would.
 */
export function beatZ(r: number): number {
  return (core.focalPx * r * WORLD_PER_LEG) / core.coreDist;
}
