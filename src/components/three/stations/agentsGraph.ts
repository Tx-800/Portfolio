import { createRandom } from "@/lib/random";

export type ClusterId = "onboarding" | "compliance";

export interface AgentGraph {
  /** Node positions (local space), flattened xyz. */
  positions: Float32Array;
  /** Cluster of each node (bridge nodes belong to neither). */
  cluster: (ClusterId | null)[];
  /** Per-node random phase for the "thinking" pulse. */
  phase: Float32Array;
  /** Per-node size. */
  size: Float32Array;
  /** Edge endpoints per group, flattened xyz pairs (for LineSegments). */
  edges: Record<ClusterId | "bridge", Float32Array>;
}

export const CLUSTER_CENTERS: Record<ClusterId, [number, number, number]> = {
  onboarding: [-2.3, 0.25, 0],
  compliance: [2.3, -0.15, 0],
};

const NODES_PER_CLUSTER = 24;
const BRIDGE_NODES = 7;

/**
 * Builds the "AI brain": two dense clusters of nodes (one per agent) joined by a loose bridge.
 * Each node links to its 2–3 nearest neighbours in the same cluster; bridge nodes link to their
 * nearest node on each side. Seeded, so the network looks the same on every load.
 */
export function buildAgentGraph(): AgentGraph {
  const random = createRandom(42);
  const points: [number, number, number][] = [];
  const cluster: (ClusterId | null)[] = [];

  (Object.keys(CLUSTER_CENTERS) as ClusterId[]).forEach((id) => {
    const [cx, cy, cz] = CLUSTER_CENTERS[id];
    for (let i = 0; i < NODES_PER_CLUSTER; i++) {
      // Random direction, radius biased towards the shell so the cluster reads as a sphere.
      const u = random() * 2 - 1;
      const a = random() * Math.PI * 2;
      const r = 1.45 * Math.cbrt(0.35 + random() * 0.65);
      const s = Math.sqrt(1 - u * u);
      points.push([cx + Math.cos(a) * s * r, cy + u * r * 0.85, cz + Math.sin(a) * s * r]);
      cluster.push(id);
    }
  });
  for (let i = 0; i < BRIDGE_NODES; i++) {
    const k = (i + 0.5) / BRIDGE_NODES;
    points.push([-1.1 + k * 2.2, 0.05 + (random() - 0.5) * 1.2, (random() - 0.5) * 1.2]);
    cluster.push(null);
  }

  const dist = (a: number, b: number) => Math.hypot(points[a][0] - points[b][0], points[a][1] - points[b][1], points[a][2] - points[b][2]);
  const nearest = (i: number, candidates: number[], n: number) =>
    candidates.filter((j) => j !== i).sort((a, b) => dist(i, a) - dist(i, b)).slice(0, n);

  const pairs: Record<ClusterId | "bridge", [number, number][]> = { onboarding: [], compliance: [], bridge: [] };
  const seen = new Set<string>();
  const add = (group: ClusterId | "bridge", a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    pairs[group].push([a, b]);
  };

  const indices = points.map((_, i) => i);
  (["onboarding", "compliance"] as ClusterId[]).forEach((id) => {
    const members = indices.filter((i) => cluster[i] === id);
    members.forEach((i) => nearest(i, members, i % 2 ? 2 : 3).forEach((j) => add(id, i, j)));
  });
  indices
    .filter((i) => cluster[i] === null)
    .forEach((i) => {
      const others = indices.filter((j) => cluster[j] === null);
      nearest(i, others, 2).forEach((j) => add("bridge", i, j));
      (["onboarding", "compliance"] as ClusterId[]).forEach((id) => {
        nearest(i, indices.filter((j) => cluster[j] === id), 1).forEach((j) => add("bridge", i, j));
      });
    });

  const toArray = (list: [number, number][]) => new Float32Array(list.flatMap(([a, b]) => [...points[a], ...points[b]]));

  return {
    positions: new Float32Array(points.flat()),
    cluster,
    phase: new Float32Array(points.map(() => random() * Math.PI * 2)),
    size: new Float32Array(points.map((_, i) => (cluster[i] ? 0.06 + random() * 0.06 : 0.05))),
    edges: { onboarding: toArray(pairs.onboarding), compliance: toArray(pairs.compliance), bridge: toArray(pairs.bridge) },
  };
}
