import { describe, expect, test } from 'bun:test';
import type { Commit, GraphModel } from '../../shared/types';
import { history } from './history';

const c = (hash: string, ...parents: string[]): Commit => ({ hash, short: hash, message: `msg ${hash}`, parents });
const graph = (g: Partial<GraphModel>): GraphModel => ({
  initialized: true,
  commits: [],
  branches: [],
  tags: [],
  head: { hash: null, branch: null },
  ...g,
});

// Oldest first, as readGraph returns them. main merged fathers-day; reaper is not merged.
const branched = graph({
  commits: [c('root'), c('p', 'root'), c('c', 'root'), c('g', 'c'), c('r', 'p'), c('x', 'c'), c('M', 'g', 'r')],
  branches: [
    { name: 'main', hash: 'M' },
    { name: 'fathers-day', hash: 'r' },
    { name: 'reaper', hash: 'x' },
  ],
  tags: [{ name: 's01', hash: 'c' }],
  head: { hash: 'M', branch: 'main' },
});

const lanes = (h: ReturnType<typeof history>) => h.rows.map((r) => [r.commit.hash, r.lane]);
const edges = (h: ReturnType<typeof history>) =>
  h.edges.map((e) => [h.rows[e.from].commit.hash, h.rows[e.to].commit.hash, e.fromLane, e.via, e.toLane]);

describe('history', () => {
  test('an empty repo has no rows', () => {
    expect(history(graph({}), 'all')).toEqual({ rows: [], edges: [], lanes: 0 });
  });

  test('a straight history is newest first in one lane', () => {
    const h = history(graph({ commits: [c('a'), c('b', 'a')], head: { hash: 'b', branch: 'main' } }), 'all');
    expect(lanes(h)).toEqual([
      ['b', 0],
      ['a', 0],
    ]);
    expect(edges(h)).toEqual([['b', 'a', 0, 0, 0]]);
    expect(h.lanes).toBe(1);
  });

  test('labels HEAD with its branch, then other branches and tags', () => {
    const h = history(branched, 'all');
    const refs = Object.fromEntries(h.rows.map((r) => [r.commit.hash, r.refs]));
    expect(refs.M).toEqual([{ kind: 'head', name: 'HEAD → main' }]);
    expect(refs.r).toEqual([{ kind: 'branch', name: 'fathers-day' }]);
    expect(refs.c).toEqual([{ kind: 'tag', name: 'tag: s01' }]);
    expect(refs.g).toEqual([]);
    expect(h.rows.filter((r) => r.head).map((r) => r.commit.hash)).toEqual(['M']);
  });

  test('a detached HEAD is labelled HEAD next to the branch it sits on', () => {
    const h = history({ ...branched, head: { hash: 'r', branch: null } }, 'all');
    expect(h.rows.find((r) => r.commit.hash === 'r')?.refs).toEqual([
      { kind: 'head', name: 'HEAD' },
      { kind: 'branch', name: 'fathers-day' },
    ]);
  });

  test('gives each branch its own lane and routes merges and forks between them', () => {
    const h = history(branched, 'all');
    expect(lanes(h)).toEqual([
      ['M', 0],
      ['x', 2],
      ['r', 1],
      ['g', 0],
      ['c', 0],
      ['p', 1],
      ['root', 0],
    ]);
    expect(edges(h)).toEqual([
      ['M', 'g', 0, 0, 0],
      ['M', 'r', 0, 1, 1],
      ['x', 'c', 2, 2, 0],
      ['r', 'p', 1, 1, 1],
      ['g', 'c', 0, 0, 0],
      ['c', 'root', 0, 0, 0],
      ['p', 'root', 1, 1, 0],
    ]);
    expect(h.lanes).toBe(3);
  });

  test('HEAD scope hides commits HEAD cannot reach', () => {
    const h = history(branched, 'head');
    expect(h.rows.map((r) => r.commit.hash)).toEqual(['M', 'r', 'g', 'c', 'p', 'root']);
    expect(h.lanes).toBe(2);
  });

  test('HEAD scope on an unborn branch is empty', () => {
    expect(history({ ...branched, head: { hash: null, branch: 'main' } }, 'head').rows).toEqual([]);
  });
});
