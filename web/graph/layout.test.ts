import { describe, expect, test } from 'bun:test';
import type { Commit, GraphModel } from '../../shared/types';
import { layout } from './layout';

const c = (hash: string, message: string, ...parents: string[]): Commit => ({ hash, short: hash, message, parents });
const graph = (g: Partial<GraphModel>): GraphModel => ({
  initialized: true,
  commits: [],
  branches: [],
  tags: [],
  head: { hash: null, branch: null },
  ...g,
});

describe('layout', () => {
  test('an empty timeline has no lanes and no HEAD position', () => {
    expect(layout(graph({}))).toEqual({
      initialized: true,
      lanes: [],
      nodes: [],
      edges: [],
      head: null,
      pending: null,
    });
  });

  test('a straight timeline is one prime lane, one column per commit', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Dalek', 'a')],
        branches: [{ name: 'prime-timeline', hash: 'b' }],
        head: { hash: 'b', branch: 'prime-timeline' },
      }),
    );
    expect(l.lanes).toEqual([{ name: 'prime-timeline', kind: 'prime' }]);
    expect(l.nodes.map((n) => [n.message, n.col, n.lane])).toEqual([
      ['Rose', 0, 0],
      ['Dalek', 1, 0],
    ]);
    expect(l.edges.map((e) => [e.from.hash, e.to.hash])).toEqual([['a', 'b']]);
    expect(l.head).toEqual({ col: 1, lane: 0, label: 'HEAD → prime-timeline' });
  });

  test('marks edges from a second parent as merges', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Dalek', 'a'), c('m', 'Merge', 'a', 'b')],
        branches: [{ name: 'prime-timeline', hash: 'm' }],
        head: { hash: 'm', branch: 'prime-timeline' },
      }),
    );
    expect(l.edges.map((e) => [e.from.hash, e.to.hash, e.merge])).toEqual([
      ['a', 'b', false],
      ['a', 'm', false],
      ['b', 'm', true],
    ]);
  });

  test('a branch gets its own lane above prime', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Pete dies', 'a'), c('x', 'Rose saves Pete', 'a')],
        branches: [
          { name: 'pete-lives', hash: 'x' },
          { name: 'prime-timeline', hash: 'b' },
        ],
        head: { hash: 'x', branch: 'pete-lives' },
      }),
    );
    expect(l.lanes).toEqual([
      { name: 'pete-lives', kind: 'branch' },
      { name: 'prime-timeline', kind: 'prime' },
    ]);
    expect(l.nodes.map((n) => [n.hash, n.lane])).toEqual([
      ['a', 1],
      ['b', 1],
      ['x', 0],
    ]);
    expect(l.nodes[2].branches).toEqual(['pete-lives']);
  });

  test("pete's world is a parallel universe below prime", () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Blink', 'a'), c('x', 'Rise of the Cybermen', 'a')],
        branches: [
          { name: 'petes-world', hash: 'x' },
          { name: 'prime-timeline', hash: 'b' },
        ],
      }),
    );
    expect(l.lanes).toEqual([
      { name: 'prime-timeline', kind: 'prime' },
      { name: 'petes-world', kind: 'parallel' },
    ]);
  });

  test('a branch with no commits of its own adds no lane', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose')],
        branches: [
          { name: 'prime-timeline', hash: 'a' },
          { name: 'petes-world', hash: 'a' },
        ],
      }),
    );
    expect(l.lanes.map((x) => x.name)).toEqual(['prime-timeline']);
    expect(l.nodes[0].branches).toEqual(['prime-timeline', 'petes-world']);
  });

  test('a commit on no branch goes to the detached lane, above prime where branches fork off', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('x', 'Save Caecilius', 'a')],
        branches: [{ name: 'prime-timeline', hash: 'a' }],
        head: { hash: 'x', branch: null },
      }),
    );
    expect(l.lanes.map((x) => x.kind)).toEqual(['detached', 'prime']);
    expect(l.head).toEqual({ col: 1, lane: 0, label: 'HEAD (detached)' });
  });

  test('tags are attached to their commit', () => {
    const l = layout(graph({ commits: [c('a', 'Pompeii')], tags: [{ name: 'fixed-point/pompeii', hash: 'a' }] }));
    expect(l.nodes[0].tags).toEqual(['fixed-point/pompeii']);
  });
});

describe('pending', () => {
  const one = graph({
    commits: [c('a1', 'Rose')],
    branches: [{ name: 'prime-timeline', hash: 'a1' }],
    head: { hash: 'a1', branch: 'prime-timeline' },
  });

  test('a dirty working dir puts a pending node after HEAD, in its lane', () => {
    expect(layout(one, true).pending).toEqual({ col: 1, lane: 0, from: { col: 0, lane: 0 } });
  });

  test('during a merge the pending node also comes from the commit being merged in', () => {
    const merging = graph({
      commits: [c('a', 'Rose'), c('b', "Father's Day", 'a'), c('x', 'Rose saves Pete', 'a')],
      branches: [
        { name: 'pete-lives', hash: 'x' },
        { name: 'prime-timeline', hash: 'b' },
      ],
      head: { hash: 'b', branch: 'prime-timeline' },
      mergeHead: 'x',
    });
    expect(layout(merging, true).pending).toEqual({
      col: 3,
      lane: 1,
      from: { col: 1, lane: 1 },
      merge: { col: 2, lane: 0 },
    });
  });

  test('a clean working dir has no pending node', () => {
    expect(layout(one, false).pending).toBeNull();
  });

  test('before the first commit the pending node starts the timeline', () => {
    const empty = graph({ head: { hash: null, branch: 'prime-timeline' } });
    expect(layout(empty, true).pending).toEqual({ col: 0, lane: 0, from: null });
  });

  test('no repo, no pending node', () => {
    expect(layout(graph({ initialized: false }), true).pending).toBeNull();
  });
});
