/**
 * TARGET SHAPES OF THE DATA CORE
 * ==============================
 * The Core is N particles. For every shape we compute one target position per particle
 * (particle i of the orb, the browser, the grid… is the "same" particle). The vertex shader
 * blends between two of these targets, so a morph is just "every particle travels from its spot
 * in shape A to its spot in shape B". All shapes fit within a radius of ~1.2 around the origin
 * (the Core's radius is 1 world unit), facing the camera (+z).
 *
 * Each shape also gives every particle a `meta` number that its effect in the shader reads
 * (which screen lights up when, which layer of the cube, which agent cluster…).
 *
 * Deterministic random numbers, so the Core looks the same on every load.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
type Rand = () => number;

type Segment = [number, number, number, number]; // x1, y1, x2, y2

/** A point at distance u (0..1) along a list of segments (by total length). */
function along(segments: Segment[], u: number, out: number[]): void {
  const lengths = segments.map(([x1, y1, x2, y2]) => Math.hypot(x2 - x1, y2 - y1));
  let d = u * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segments.length; i++) {
    if (d <= lengths[i] || i === segments.length - 1) {
      const k = lengths[i] ? Math.min(d / lengths[i], 1) : 0;
      const [x1, y1, x2, y2] = segments[i];
      out[0] = x1 + (x2 - x1) * k;
      out[1] = y1 + (y2 - y1) * k;
      return;
    }
    d -= lengths[i];
  }
}

const rect = (cx: number, cy: number, w: number, h: number): Segment[] => {
  const [l, r, b, t] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2];
  return [
    [l, b, r, b],
    [r, b, r, t],
    [r, t, l, t],
    [l, t, l, b],
  ];
};

/** Rotate (x, y, z) by Euler angles (X then Y then Z). */
function rotate(p: number[], [ax, ay, az]: [number, number, number]): void {
  let [x, y, z] = p;
  [y, z] = [y * Math.cos(ax) - z * Math.sin(ax), y * Math.sin(ax) + z * Math.cos(ax)];
  [x, z] = [x * Math.cos(ay) + z * Math.sin(ay), -x * Math.sin(ay) + z * Math.cos(ay)];
  [x, y] = [x * Math.cos(az) - y * Math.sin(az), x * Math.sin(az) + y * Math.cos(az)];
  p[0] = x;
  p[1] = y;
  p[2] = z;
}

/** A random point in a small ball (for "nodes", seals and dots). */
function blob(p: number[], cx: number, cy: number, cz: number, radius: number, rand: Rand): void {
  const a = rand() * Math.PI * 2;
  const z = rand() * 2 - 1;
  const r = Math.cbrt(rand()) * radius;
  const s = Math.sqrt(1 - z * z);
  p[0] = cx + Math.cos(a) * s * r;
  p[1] = cy + Math.sin(a) * s * r;
  p[2] = cz + z * r;
}

export const GRID = { cols: 3, rows: 3, w: 0.62, h: 0.42, gap: 0.1 };
/** The browser window: frame size and the title bar's height (the screenshot fills the rest). */
export const BROWSER = { w: 2.1, h: 1.45, bar: 0.2 };

export const SHAPE_NAMES = ["orb", "browser", "grid", "cube", "scan", "network", "merge", "globe", "envelope"] as const;

/** Fills p (x, y, z) for particle i of n; returns the particle's meta value. */
type Generator = (i: number, n: number, rand: Rand, p: number[]) => number;

/* ---------------------------------------------------------------- 0 orb */
const orb: Generator = (i, n, rand, p) => {
  // 72% on a sphere shell (Fibonacci spiral, a little depth), 28% on two tilted rings.
  if (i < n * 0.72) {
    const k = i / (n * 0.72);
    const y = 1 - 2 * k;
    const ring = Math.sqrt(1 - y * y);
    const phi = i * 2.399963; // golden angle
    const r = 1 - rand() * 0.06;
    p[0] = Math.cos(phi) * ring * r;
    p[1] = y * r;
    p[2] = Math.sin(phi) * ring * r;
  } else {
    const outer = rand() < 0.5;
    const a = rand() * Math.PI * 2;
    const radius = (outer ? 1.62 : 1.32) + (rand() - 0.5) * 0.02;
    p[0] = Math.cos(a) * radius;
    p[1] = Math.sin(a) * radius;
    p[2] = (rand() - 0.5) * 0.02;
    rotate(p, outer ? [1.35, -0.5, 0.4] : [1.15, 0.3, 0]);
  }
  return 0;
};

/* ---------------------------------------------------------------- 1 browser */
const browserFrame = rect(0, 0, BROWSER.w, BROWSER.h);
const titleBar: Segment[] = [[-BROWSER.w / 2, BROWSER.h / 2 - BROWSER.bar, BROWSER.w / 2, BROWSER.h / 2 - BROWSER.bar]];
const BARS = [
  { y: 0.2, w: 1.45 },
  { y: -0.08, w: 1.15 },
  { y: -0.36, w: 0.85 },
];
const browser: Generator = (_i, _n, rand, p) => {
  // Frame, title bar, three dots, three filled content bars.
  const pick = rand();
  const v = rand();
  if (pick < 0.42) along(browserFrame, v, p);
  else if (pick < 0.5) along(titleBar, v, p);
  else if (pick < 0.55) {
    const d = Math.floor(v * 3);
    blob(p, -BROWSER.w / 2 + 0.16 + d * 0.12, BROWSER.h / 2 - 0.1, 0, 0.045, rand);
  } else {
    const bar = BARS[Math.floor(v * 3)];
    p[0] = -BROWSER.w / 2 + 0.2 + rand() * bar.w;
    p[1] = bar.y + (rand() - 0.5) * 0.12;
  }
  p[2] = (rand() - 0.5) * 0.03;
  return 0;
};

/* ---------------------------------------------------------------- 2 grid */
const LIGHT_ORDER = [4, 1, 5, 7, 3, 0, 2, 8, 6]; // spirals out from the centre
const grid: Generator = (i, _n, rand, p) => {
  // 3 × 3 small screens; 45% of each screen's particles on its outline, the rest inside.
  const c = i % 9;
  const gw = GRID.cols * GRID.w + (GRID.cols - 1) * GRID.gap;
  const gh = GRID.rows * GRID.h + (GRID.rows - 1) * GRID.gap;
  const cx = -gw / 2 + GRID.w / 2 + (c % 3) * (GRID.w + GRID.gap);
  const cy = gh / 2 - GRID.h / 2 - Math.floor(c / 3) * (GRID.h + GRID.gap);
  if (rand() < 0.45) along(rect(cx, cy, GRID.w, GRID.h), rand(), p);
  else {
    p[0] = cx + (rand() - 0.5) * GRID.w * 0.86;
    p[1] = cy + (rand() - 0.5) * GRID.h * 0.8;
  }
  p[2] = (rand() - 0.5) * 0.03;
  return LIGHT_ORDER.indexOf(c); // meta: lighting order 0..8
};

/* ---------------------------------------------------------------- 3 crystal cube */
const CUBE = 0.64; // half the edge length
const cube: Generator = (_i, _n, rand, p) => {
  // 55% on the 12 edges, 20% scattered on the faces, 25% on three horizontal "layers" inside.
  const h = CUBE;
  const pick = rand();
  if (pick < 0.55) {
    const axis = Math.floor(rand() * 3);
    const a = rand() < 0.5 ? -h : h;
    const b = rand() < 0.5 ? -h : h;
    const u = (rand() * 2 - 1) * h;
    const v = [a, b];
    p[axis] = u;
    p[(axis + 1) % 3] = v[0];
    p[(axis + 2) % 3] = v[1];
  } else if (pick < 0.75) {
    const axis = Math.floor(rand() * 3);
    p[axis] = rand() < 0.5 ? -h : h;
    p[(axis + 1) % 3] = (rand() * 2 - 1) * h;
    p[(axis + 2) % 3] = (rand() * 2 - 1) * h;
  } else {
    const layer = [-h / 2, 0, h / 2][Math.floor(rand() * 3)];
    p[0] = (rand() * 2 - 1) * h * 0.96;
    p[1] = layer;
    p[2] = (rand() * 2 - 1) * h * 0.96;
  }
  const height = (p[1] + h) / (2 * h); // meta: 0 at the bottom, 1 at the top
  rotate(p, [0.5, 0.72, 0]); // a crystal seen from slightly above
  return height;
};

/* ---------------------------------------------------------------- 4 scanning ring */
const TABLE = { w: 0.6, h: 0.4 };
const TABLES = [
  [-0.36, 0.26],
  [0.36, 0.26], // this one goes stale
  [-0.36, -0.26],
  [0.36, -0.26],
];
const scan: Generator = (_i, _n, rand, p) => {
  // A scanning ring (35%), four little tables inside (55%), a small alert envelope (10%).
  const pick = rand();
  if (pick < 0.35) {
    const a = rand() * Math.PI * 2;
    const r = 1.12 + (rand() - 0.5) * 0.05;
    p[0] = Math.cos(a) * r;
    p[1] = Math.sin(a) * r;
    p[2] = (rand() - 0.5) * 0.04;
    return 0;
  }
  if (pick < 0.9) {
    const t = Math.floor(rand() * 4);
    const [cx, cy] = TABLES[t];
    if (rand() < 0.55) along(rect(cx, cy, TABLE.w, TABLE.h), rand(), p);
    else {
      // Rows of the table.
      const row = Math.floor(rand() * 3);
      p[0] = cx + (rand() - 0.5) * TABLE.w * 0.84;
      p[1] = cy + TABLE.h / 2 - 0.1 - row * 0.1;
    }
    p[2] = (rand() - 0.5) * 0.03;
    return t === 1 ? 1 : 0; // meta 1 = the stale table
  }
  // Envelope: small rectangle + V, sitting on the stale table.
  const [cx, cy] = TABLES[1];
  const env = [...rect(cx, cy, 0.3, 0.2), [cx - 0.15, cy + 0.1, cx, cy - 0.02], [cx, cy - 0.02, cx + 0.15, cy + 0.1]] as Segment[];
  along(env, rand(), p);
  p[2] = 0.05;
  return 2; // meta 2 = the envelope that shoots out
};

/* ---------------------------------------------------------------- 5 agent network */
/** QAgent's test report: a small page in front of the left cluster. */
const REPORT = { cx: -0.55, cy: 0.04, w: 0.44, h: 0.58, rows: [0.1, -0.04, -0.18] };
const network = (() => {
  // Two clusters of nodes (QAgent left, Compliance right), linked inside, two bridges. In front
  // of the QAgent cluster: a test report with three check marks and the reply envelope (the
  // shader flies the report in, lights the checks and sends the reply out).
  const rand = rng(23);
  const clusters = [
    { cx: -0.55, cy: 0.06, meta: 0 },
    { cx: 0.55, cy: -0.06, meta: 1 },
  ];
  const nodes = clusters.flatMap((c) =>
    Array.from({ length: 8 }, () => {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 0.42;
      return { x: c.cx + Math.cos(a) * r, y: c.cy + Math.sin(a) * r * 1.25, z: (rand() - 0.5) * 0.4, meta: c.meta };
    }),
  );
  const links: { a: (typeof nodes)[number]; b: (typeof nodes)[number]; meta: number }[] = [];
  nodes.forEach((n, i) => {
    const near = nodes
      .map((m, j) => ({ m, j, d: Math.hypot(n.x - m.x, n.y - m.y) }))
      .filter(({ j, m }) => j !== i && m.meta === n.meta)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    near.forEach(({ m }) => links.push({ a: n, b: m, meta: n.meta }));
  });
  links.push({ a: nodes[1], b: nodes[9], meta: 0.5 }, { a: nodes[4], b: nodes[12], meta: 0.5 });

  const { cx, cy, w, h, rows } = REPORT;
  const page: Segment[] = [
    ...rect(cx, cy, w, h),
    [cx - w * 0.36, cy + h * 0.36, cx + w * 0.1, cy + h * 0.36], // title line
    ...rows.map((y): Segment => [cx - w * 0.36, cy + y, cx + w * 0.12, cy + y]),
  ];
  const reply: Segment[] = [...rect(cx, cy, 0.32, 0.21), [cx - 0.16, cy + 0.105, cx, cy - 0.02], [cx, cy - 0.02, cx + 0.16, cy + 0.105]];

  const gen: Generator = (_i, _n, rand2, p) => {
    const pick = rand2();
    if (pick < 0.5) {
      const n = nodes[Math.floor(rand2() * nodes.length)];
      blob(p, n.x, n.y, n.z, 0.055, rand2);
      return n.meta;
    }
    if (pick < 0.82) {
      const l = links[Math.floor(rand2() * links.length)];
      const u = rand2();
      p[0] = l.a.x + (l.b.x - l.a.x) * u;
      p[1] = l.a.y + (l.b.y - l.a.y) * u;
      p[2] = l.a.z + (l.b.z - l.a.z) * u;
      return l.meta; // meta: 0 QAgent, 1 Compliance, 0.5 bridge
    }
    if (pick < 0.92) {
      along(page, rand2(), p);
      p[2] = 0.3;
      return 3; // meta 3: the report page
    }
    if (pick < 0.96) {
      const row = Math.floor(rand2() * rows.length);
      blob(p, cx + w * 0.3, cy + rows[row], 0.3, 0.035, rand2);
      return 4 + row / 10; // meta 4.0 / 4.1 / 4.2: the check mark of each row
    }
    along(reply, rand2(), p);
    p[2] = 0.34;
    return 5; // meta 5: the reply envelope
  };
  return gen;
})();

/* ---------------------------------------------------------------- 6 many → one */
const PEOPLE = Array.from({ length: 6 }, (_, k) => {
  const a = Math.PI / 2 + (k * Math.PI * 2) / 6;
  return [Math.cos(a) * 0.8, Math.sin(a) * 0.8] as const;
});
const merge: Generator = (_i, _n, rand, p) => {
  // Before: a ring of six people (one of them the developer) tangled in back-and-forth lines.
  // After: one email. The shader pulls the people into the centre and grows the envelope out of it.
  const people = PEOPLE;
  const pick = rand();
  if (pick < 0.5) {
    const k = Math.floor(rand() * people.length);
    const [x, y] = people[k];
    if (rand() < 0.45) {
      // Head.
      const a = rand() * Math.PI * 2;
      p[0] = x + Math.cos(a) * 0.085;
      p[1] = y + 0.08 + Math.sin(a) * 0.085;
    } else {
      // Shoulders: the upper half of a ring.
      const a = rand() * Math.PI;
      p[0] = x + Math.cos(a) * 0.15;
      p[1] = y - 0.14 + Math.sin(a) * 0.12;
    }
    p[2] = (rand() - 0.5) * 0.04;
    return k === 0 ? 0.5 : 0; // meta 0: person, 0.5: the developer
  }
  if (pick < 0.75) {
    // Back-and-forth: lines between random pairs of people.
    const a = people[Math.floor(rand() * people.length)];
    const b = people[Math.floor(rand() * people.length)];
    const u = rand();
    p[0] = a[0] + (b[0] - a[0]) * u;
    p[1] = a[1] + (b[1] - a[1]) * u;
    p[2] = (rand() - 0.5) * 0.06;
    return 1; // meta 1: links
  }
  const [ew, eh] = [1.0, 0.64];
  along([...rect(0, 0, ew, eh), [-ew / 2, eh / 2, 0, -0.04], [0, -0.04, ew / 2, eh / 2]], rand(), p);
  p[2] = 0.02;
  return 2; // meta 2: the one email
};

/* ---------------------------------------------------------------- 7 skill globe */
const globe: Generator = (_i, _n, rand, p) => {
  // Latitude/longitude lines (75%) and bright "skill" dots (25%). The shader spins it.
  const pick = rand();
  if (pick < 0.75) {
    let lat: number;
    let lon: number;
    if (rand() < 0.5) {
      lat = (Math.floor(rand() * 7) - 3) * (Math.PI / 8);
      lon = rand() * Math.PI * 2;
    } else {
      lon = Math.floor(rand() * 10) * ((Math.PI * 2) / 10);
      lat = (rand() - 0.5) * Math.PI;
    }
    p[0] = Math.cos(lat) * Math.cos(lon);
    p[1] = Math.sin(lat);
    p[2] = Math.cos(lat) * Math.sin(lon);
    return 0;
  }
  const dot = Math.floor(rand() * 36);
  const dr = rng(100 + dot);
  const lat = Math.asin(dr() * 2 - 1);
  const lon = dr() * Math.PI * 2;
  blob(p, Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon), 0.05, rand);
  return 1; // meta 1: skill dot
};

/* ---------------------------------------------------------------- 8 envelope */
export const ENVELOPE = { w: 1.7, h: 1.05, cy: -0.1, flap: 0.46 };
const envelope: Generator = (_i, _n, rand, p) => {
  // Body outline + inner folds; an OPEN flap (the shader closes it); the seal (the old core).
  const { w, h, cy, flap } = ENVELOPE;
  const top = cy + h / 2;
  const pick = rand();
  if (pick < 0.5) {
    along([...rect(0, cy, w, h), [-w / 2, cy - h / 2, 0, cy + 0.02], [0, cy + 0.02, w / 2, cy - h / 2]], rand(), p);
    p[2] = 0;
    return 0;
  }
  if (pick < 0.9) {
    along(
      [
        [-w / 2, top, 0, top + flap],
        [0, top + flap, w / 2, top],
      ],
      rand(),
      p,
    );
    p[2] = 0.01;
    return 1; // meta 1: flap
  }
  blob(p, 0, top - flap + 0.02, 0.06, 0.13, rand);
  return 2; // meta 2: seal
};

const GENERATORS: Generator[] = [orb, browser, grid, cube, scan, network, merge, globe, envelope];

export interface CoreShapes {
  count: number;
  /** Per shape (SHAPE_NAMES order): positions (xyz per particle) and meta (one per particle). */
  positions: Float32Array[];
  meta: Float32Array[];
  /** Per particle: random direction (xyz, for the burst) + random 0..1 (w, for stagger/shimmer). */
  random: Float32Array;
  /** Per particle: position in the gold → orange → pink gradient (0..1). */
  tone: Float32Array;
}

export function createCoreShapes(count: number): CoreShapes {
  const positions = GENERATORS.map(() => new Float32Array(count * 3));
  const meta = GENERATORS.map(() => new Float32Array(count));
  const random = new Float32Array(count * 4);
  const tone = new Float32Array(count);
  const p = [0, 0, 0];

  GENERATORS.forEach((gen, s) => {
    const rand = rng(7 + s * 101);
    for (let i = 0; i < count; i++) {
      p[0] = p[1] = p[2] = 0;
      meta[s][i] = gen(i, count, rand, p);
      positions[s].set(p, i * 3);
    }
  });

  const rand = rng(3);
  for (let i = 0; i < count; i++) {
    // Tone follows the orb's height (gold on top → pink below), with some noise.
    tone[i] = Math.min(1, Math.max(0, (1 - positions[0][i * 3 + 1]) / 2 + (rand() - 0.5) * 0.25));
    const theta = rand() * Math.PI * 2;
    const z = rand() * 2 - 1;
    const s = Math.sqrt(1 - z * z);
    random.set([Math.cos(theta) * s, Math.sin(theta) * s, z, rand()], i * 4);
  }
  return { count, positions, meta, random, tone };
}
