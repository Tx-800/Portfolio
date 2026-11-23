import { CatmullRomCurve3, Vector3 } from "three";
import { chapters, type ChapterId } from "@/data/content";

type Vec3 = readonly [number, number, number];
/** Where the station object should appear on screen, in NDC (−1 left/bottom … +1 right/top). */
type Frame = readonly [number, number];

export interface StationDef {
  /** World position of the station's hero object. */
  position: Vec3;
  /** Camera position relative to `position` while holding at this chapter. */
  camera: Vec3;
  /** Where the data packet hovers relative to `position` while holding. */
  packet: Vec3;
  /**
   * Screen framing, so the object sits beside the HTML panel instead of under it.
   * Desktop: opposite side of the panel. Mobile stage: centred in the 3D band at the top of the
   * screen (the canvas is only that band), nudged down a little from under the header.
   */
  frame: { desktop: Frame; mobile: Frame };
  /** If set, the packet circles the station at this radius while parked (The Builder). */
  orbit?: number;
  /** Packet scale while parked (< 1 = it settles into something, e.g. the inbox). */
  packetScale?: number;
}

/**
 * The journey winds left/right and slightly up/down as it travels into the scene (−z).
 */
export const STATIONS: Record<ChapterId, StationDef> = {
  boot: { position: [0, 0, 16], camera: [0, 0.5, 12], packet: [0, 0, 0], frame: { desktop: [0, 0], mobile: [0, -0.06] } },
  spark: { position: [0, 0, 0], camera: [0, 0.2, 7], packet: [0, 0, 0], frame: { desktop: [0.5, 0.1], mobile: [0, -0.06] } },
  websites: { position: [-9, 1.5, -18], camera: [2, 0.8, 16], packet: [0, 1.75, 0.8], frame: { desktop: [0.42, 0.32], mobile: [0, -0.06] } },
  cockpit: { position: [8, -1, -36], camera: [-2.5, 2.4, 15.5], packet: [0, 2.2, 1.4], frame: { desktop: [-0.45, 0.05], mobile: [0, -0.06] } },
  pipeline: { position: [-7, 0.5, -54], camera: [3, 1.2, 14.5], packet: [0, 0, 0], frame: { desktop: [0.38, 0.02], mobile: [0, -0.06] } },
  watchtower: { position: [9, 3, -72], camera: [-2.5, 3.2, 15.5], packet: [-2.6, 2.2, 0.6], frame: { desktop: [-0.52, 0.02], mobile: [0, -0.06] } },
  agents: { position: [-7, 1, -90], camera: [0, 1.2, 16], packet: [0, 0.2, 0.6], frame: { desktop: [0.47, 0.3], mobile: [0, -0.06] } },
  impact: { position: [6, -1, -108], camera: [0, 0.6, 15], packet: [-3.4, 1.5, 0.8], frame: { desktop: [0.5, 0.28], mobile: [0, -0.06] } },
  builder: { position: [-3, 0.5, -126], camera: [0, 0.8, 15], packet: [0, 0, 0], frame: { desktop: [0.5, 0.28], mobile: [0, -0.06] }, orbit: 3.4 },
  contact: { position: [0, 0, -144], camera: [0, 0.6, 12], packet: [0, 0.15, 0.35], frame: { desktop: [0.42, 0.02], mobile: [0, -0.06] }, packetScale: 0.55 },
};

export const STATION_ORDER: ChapterId[] = chapters.map((chapter) => chapter.id);
export const STATION_COUNT = STATION_ORDER.length;

export function stationIndex(id: ChapterId): number {
  return STATION_ORDER.indexOf(id);
}

export interface JourneyCurves {
  /** Path of the data packet. */
  packet: CatmullRomCurve3;
  /** Path of the camera. */
  camera: CatmullRomCurve3;
  /** What the camera looks at (the station objects). */
  target: CatmullRomCurve3;
}

let curves: JourneyCurves | undefined;

/**
 * Three curves through the same stations, all sampled with the SAME t:
 *   packet(t), camera(t) and target(t) stay in sync, so at a hold the camera frames its
 *   station and the packet hovers beside it.
 *
 * Read them with `getPoint(t)`, NOT `getPointAt(t)`: getPoint is parameter-based, so control
 * point i is reached at exactly t = i / (n − 1), which is how lib/scrollMap.ts places the
 * stations. (getPointAt is arc-length based and would drift away from the stations.)
 * "centripetal" avoids loops and overshoot at sharp turns.
 */
export function getCurves(): JourneyCurves {
  if (curves) return curves;
  const build = (offset: (def: StationDef) => Vec3) =>
    new CatmullRomCurve3(
      STATION_ORDER.map((id) => {
        const def = STATIONS[id];
        const [ox, oy, oz] = offset(def);
        return new Vector3(def.position[0] + ox, def.position[1] + oy, def.position[2] + oz);
      }),
      false,
      "centripetal",
    );
  curves = {
    packet: build((def) => def.packet),
    camera: build((def) => def.camera),
    target: build(() => [0, 0, 0]),
  };
  return curves;
}

/**
 * Screen framing at path position t: blends between neighbouring stations with smoothstep,
 * so the object glides from one side of the screen to the other during travel.
 */
export function frameAt(t: number, mobile: boolean, out: [number, number]): [number, number] {
  const f = Math.min(Math.max(t, 0), 1) * (STATION_COUNT - 1);
  const i = Math.min(Math.floor(f), STATION_COUNT - 2);
  const k = f - i;
  const s = k * k * (3 - 2 * k);
  const a = STATIONS[STATION_ORDER[i]].frame[mobile ? "mobile" : "desktop"];
  const b = STATIONS[STATION_ORDER[i + 1]].frame[mobile ? "mobile" : "desktop"];
  out[0] = a[0] + (b[0] - a[0]) * s;
  out[1] = a[1] + (b[1] - a[1]) * s;
  return out;
}
