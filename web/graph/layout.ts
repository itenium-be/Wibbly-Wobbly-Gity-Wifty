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
};
export type Edge = { from: Node; to: Node };
export type Head = { col: number; lane: number; label: string };
export type Pending = { col: number; lane: number; from: { col: number; lane: number } | null };
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
const UNIVERSES = new Set(['petes-world']);

const kindOf = (name: string): LaneKind => {
  if (name === PRIME) return 'prime';
  if (name === DETACHED) return 'detached';
  return UNIVERSES.has(name) ? 'parallel' : 'branch';
};

// Top to bottom: ordinary branches above prime, parallel universes and detached commits below.
const ORDER: LaneKind[] = ['branch', 'prime', 'parallel', 'detached'];

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
  for (const c of graph.commits) claim(c.hash, DETACHED);

  const used = new Set(owner.values());
  const laneNames = [...branches.map((b) => b.name), DETACHED]
    .filter((n) => used.has(n))
    .sort((a, b) => ORDER.indexOf(kindOf(a)) - ORDER.indexOf(kindOf(b)));
  const lanes = laneNames.map((name) => ({ name, kind: kindOf(name) }));

  const nodes: Node[] = graph.commits.map((c, col) => ({
    hash: c.hash,
    short: c.short,
    message: c.message,
    col,
    lane: laneNames.indexOf(owner.get(c.hash) ?? DETACHED),
    tags: graph.tags.filter((t) => t.hash === c.hash).map((t) => t.name),
    branches: graph.branches.filter((b) => b.hash === c.hash).map((b) => b.name),
  }));

  const byHash = new Map(nodes.map((n) => [n.hash, n]));
  const edges: Edge[] = graph.commits.flatMap((c) =>
    c.parents.flatMap((p) => {
      const from = byHash.get(p);
      const to = byHash.get(c.hash);
      return from && to ? [{ from, to }] : [];
    }),
  );

  const at = graph.head.hash ? byHash.get(graph.head.hash) : undefined;
  const head = at
    ? { col: at.col, lane: at.lane, label: graph.head.branch ? `HEAD → ${graph.head.branch}` : 'HEAD (detached)' }
    : null;

  const pending =
    dirty && graph.initialized
      ? {
          col: nodes.length,
          lane: at?.lane ?? Math.max(0, laneNames.indexOf(PRIME)),
          from: at ? { col: at.col, lane: at.lane } : null,
        }
      : null;

  return { initialized: graph.initialized, lanes, nodes, edges, head, pending };
}
