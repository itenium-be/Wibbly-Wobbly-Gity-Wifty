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
    expect(layout(graph({}))).toEqual({ initialized: true, lanes: [], nodes: [], edges: [], head: null });
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

  test('a branch gets its own parallel lane below prime', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Pete dies', 'a'), c('x', 'Rose saves Pete', 'a')],
        branches: [
          { name: 'fathers-day', hash: 'x' },
          { name: 'prime-timeline', hash: 'b' },
        ],
        head: { hash: 'x', branch: 'fathers-day' },
      }),
    );
    expect(l.lanes).toEqual([
      { name: 'prime-timeline', kind: 'prime' },
      { name: 'fathers-day', kind: 'parallel' },
    ]);
    expect(l.nodes.map((n) => [n.hash, n.lane])).toEqual([
      ['a', 0],
      ['b', 0],
      ['x', 1],
    ]);
    expect(l.nodes[2].branches).toEqual(['fathers-day']);
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

  test('a commit on no branch goes to the detached lane', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('x', 'Save Caecilius', 'a')],
        branches: [{ name: 'prime-timeline', hash: 'a' }],
        head: { hash: 'x', branch: null },
      }),
    );
    expect(l.lanes[1]).toEqual({ name: 'detached', kind: 'detached' });
    expect(l.head).toEqual({ col: 1, lane: 1, label: 'HEAD (detached)' });
  });

  test('tags are attached to their commit', () => {
    const l = layout(graph({ commits: [c('a', 'Pompeii')], tags: [{ name: 'fixed-point/pompeii', hash: 'a' }] }));
    expect(l.nodes[0].tags).toEqual(['fixed-point/pompeii']);
  });
});
