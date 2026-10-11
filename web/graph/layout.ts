import type { GraphModel } from '../../shared/types';

export type LaneKind = 'prime' | 'branch' | 'parallel' | 'detached';
export type Lane = { name: string; kind: LaneKind };
export type Node = {
  hash: string;
  short: string;
  message: string;
  col: number;
  lane: number;
  tags: string[];
  branches: string[];
  lost?: true;
};
export type Edge = { from: Node; to: Node; merge: boolean };
export type Head = { col: number; lane: number; label: string };
type Position = { col: number; lane: number };
export type Pending = { col: number; lane: number; from: Position | null; merge?: Position };
export type Layout = {
  initialized: boolean;
  lanes: Lane[];
  nodes: Node[];
  edges: Edge[];
  head: Head | null;
  pending: Pending | null;
};

const PRIME = 'prime-timeline';
const DETACHED = 'detached';
const REFLOG = 'reflog';
const LOST = 'lost';
const UNIVERSES = new Set(['petes-world']);
const isLost = (name: string) => name === LOST || name.startsWith(`${LOST} `);

const kindOf = (name: string): LaneKind => {
  if (name === PRIME) return 'prime';
  if (name === DETACHED || name === REFLOG || isLost(name)) return 'detached';
  return UNIVERSES.has(name) ? 'parallel' : 'branch';
};

// Top to bottom: ordinary branches above prime, parallel universes and merged-in commits below.
// Commits only HEAD reaches (a deleted branch checked out from the reflog) sit above prime, where that branch was.
// Lost commits sit just below prime, so the shas the presenter still types stay on screen next to where they were.
const ORDER = ['branch', REFLOG, 'prime', LOST, 'parallel', 'detached'];
const slotOf = (name: string) => (name === REFLOG ? REFLOG : isLost(name) ? LOST : kindOf(name));

export function layout(graph: GraphModel, dirty = false): Layout {
  const firstParent = new Map(graph.commits.map((c) => [c.hash, c.parents[0] ?? null]));
  const owner = new Map<string, string>();
  const claim = (tip: string | null, lane: string) => {
    for (let h = tip; h !== null && !owner.has(h); h = firstParent.get(h) ?? null) owner.set(h, lane);
  };

  const branches = [...graph.branches].sort(
    (a, b) => Number(b.name === PRIME) - Number(a.name === PRIME) || a.name.localeCompare(b.name),
  );
  for (const b of branches) claim(b.hash, b.name);

  const parents = new Map(graph.commits.map((c) => [c.hash, c.parents]));
  const reachable = new Set<string>();
  const stack = graph.branches.map((b) => b.hash);
  for (let h = stack.pop(); h !== undefined; h = stack.pop())
    if (!reachable.has(h)) {
      reachable.add(h);
      stack.push(...(parents.get(h) ?? []));
    }
  // A lost commit continues its parent's lane only while that parent is the lane's newest commit:
  // two lost chains in one lane would read as one following the other.
  const lostLanes: string[] = [];
  const newest = new Map<string, string>();
  for (const c of graph.commits) {
    if (!c.lost) {
      claim(c.hash, reachable.has(c.hash) ? DETACHED : REFLOG);
      continue;
    }
    const parentLane = owner.get(c.parents[0]);
    let lane = parentLane && newest.get(parentLane) === c.parents[0] ? parentLane : undefined;
    if (!lane) {
      lane = lostLanes.length ? `${LOST} ${lostLanes.length + 1}` : LOST;
      lostLanes.push(lane);
    }
    owner.set(c.hash, lane);
    newest.set(lane, c.hash);
  }

  const used = new Set(owner.values());
  const laneNames = [...branches.map((b) => b.name), REFLOG, ...lostLanes, DETACHED]
    .filter((n) => used.has(n))
    .sort((a, b) => ORDER.indexOf(slotOf(a)) - ORDER.indexOf(slotOf(b)));
  const lanes = laneNames.map((name) => ({ name, kind: kindOf(name) }));

  const nodes: Node[] = graph.commits.map((c, col) => ({
    hash: c.hash,
    short: c.short,
    message: c.message,
    col,
    lane: laneNames.indexOf(owner.get(c.hash) ?? DETACHED),
    tags: graph.tags.filter((t) => t.hash === c.hash).map((t) => t.name),
    branches: graph.branches.filter((b) => b.hash === c.hash).map((b) => b.name),
    ...(c.lost && { lost: true as const }),
  }));

  const byHash = new Map(nodes.map((n) => [n.hash, n]));
  const edges: Edge[] = graph.commits.flatMap((c) =>
    c.parents.flatMap((p, i) => {
      const from = byHash.get(p);
      const to = byHash.get(c.hash);
      return from && to ? [{ from, to, merge: i > 0 }] : [];
    }),
  );

  const at = graph.head.hash ? byHash.get(graph.head.hash) : undefined;
  const head = at
    ? { col: at.col, lane: at.lane, label: graph.head.branch ? `HEAD → ${graph.head.branch}` : 'HEAD (detached)' }
    : null;

  const merged = graph.mergeHead ? byHash.get(graph.mergeHead) : undefined;
  const pending =
    dirty && graph.initialized && graph.head.branch
      ? {
          col: nodes.length,
          lane: at?.lane ?? Math.max(0, laneNames.indexOf(PRIME)),
          from: at ? { col: at.col, lane: at.lane } : null,
          ...(merged && { merge: { col: merged.col, lane: merged.lane } }),
        }
      : null;

  return { initialized: graph.initialized, lanes, nodes, edges, head, pending };
}
