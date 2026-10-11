import type { Commit, GraphModel } from '../../shared/types';

export type Scope = 'head' | 'all';
export type RefLabel = { kind: 'head' | 'branch' | 'tag'; name: string };
export type HistoryRow = { commit: Commit; lane: number; refs: RefLabel[]; head: boolean };
/** Row indices; the line leaves `fromLane`, runs down `via`, and joins the parent in `toLane`. */
export type HistoryEdge = { from: number; to: number; fromLane: number; via: number; toLane: number };
export type History = { rows: HistoryRow[]; edges: HistoryEdge[]; lanes: number };

function reachable(commits: Commit[], from: string | null): Set<string> {
  const parents = new Map(commits.map((c) => [c.hash, c.parents]));
  const seen = new Set<string>();
  const todo = from ? [from] : [];
  for (let hash = todo.pop(); hash !== undefined; hash = todo.pop()) {
    if (seen.has(hash)) continue;
    seen.add(hash);
    todo.push(...(parents.get(hash) ?? []));
  }
  return seen;
}

export function labels(graph: GraphModel, hash: string): RefLabel[] {
  const { head } = graph;
  const refs: RefLabel[] = [];
  if (head.hash === hash) refs.push({ kind: 'head', name: head.branch ? `HEAD → ${head.branch}` : 'HEAD' });
  for (const b of graph.branches)
    if (b.hash === hash && b.name !== head.branch) refs.push({ kind: 'branch', name: b.name });
  for (const t of graph.tags) if (t.hash === hash) refs.push({ kind: 'tag', name: `tag: ${t.name}` });
  return refs;
}

const claim = (slots: (string | null)[], hash: string) => {
  const free = slots.indexOf(null);
  if (free === -1) return slots.push(hash) - 1;
  slots[free] = hash;
  return free;
};

/** `git log --graph` order: newest first, each open line keeps its lane until its commit appears. */
export function history(graph: GraphModel, scope: Scope): History {
  const keep = scope === 'head' ? reachable(graph.commits, graph.head.hash) : null;
  const commits = graph.commits.filter((c) => !keep || keep.has(c.hash)).reverse();
  const index = new Map(commits.map((c, i) => [c.hash, i]));

  const slots: (string | null)[] = [];
  const rows: HistoryRow[] = [];
  const pending: Omit<HistoryEdge, 'toLane'>[] = [];
  commits.forEach((commit, i) => {
    let lane = slots.indexOf(commit.hash);
    if (lane === -1) lane = claim(slots, commit.hash);
    for (let s = 0; s < slots.length; s++) if (slots[s] === commit.hash) slots[s] = null;

    commit.parents.forEach((p, n) => {
      const to = index.get(p);
      if (to === undefined) return;
      let via: number;
      if (n === 0) {
        via = lane;
        slots[lane] = p;
      } else {
        via = slots.indexOf(p);
        if (via === -1) via = claim(slots, p);
      }
      pending.push({ from: i, to, fromLane: lane, via });
    });

    rows.push({ commit, lane, refs: labels(graph, commit.hash), head: commit.hash === graph.head.hash });
  });

  return {
    rows,
    edges: pending.map((e) => ({ ...e, toLane: rows[e.to].lane })),
    lanes: rows.length ? Math.max(...rows.map((r) => r.lane), ...pending.map((e) => e.via)) + 1 : 0,
  };
}
