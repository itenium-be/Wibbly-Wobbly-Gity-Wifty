import { describe, expect, test } from 'bun:test';
import type { GitStep } from '../shared/types';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { readGraph } from './graph';

async function repo(steps: GitStep[]) {
  const dir = await tmp();
  await buildSnapshot(dir, steps);
  return readGraph(dir);
}

describe('readGraph', () => {
  test('a plain directory is not initialized', async () => {
    expect(await repo([])).toEqual({
      initialized: false,
      commits: [],
      branches: [],
      tags: [],
      head: { hash: null, branch: null },
    });
  });

  test('an empty repo sits on prime-timeline with no commits', async () => {
    const g = await repo([{ git: ['init', '-q'] }]);
    expect(g.initialized).toBe(true);
    expect(g.commits).toEqual([]);
    expect(g.head).toEqual({ hash: null, branch: 'prime-timeline' });
  });

  test('reads commits oldest first with parents, branches, tags and HEAD', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { commit: 'Dalek' },
      { git: ['tag', 'fixed-point', 'HEAD~1'] },
      { git: ['branch', 'petes-world'] },
    ]);
    const [rose, dalek] = g.commits;
    expect(g.commits.map((c) => c.message)).toEqual(['Rose', 'Dalek']);
    expect(rose.parents).toEqual([]);
    expect(dalek.parents).toEqual([rose.hash]);
    expect(dalek.hash.startsWith(dalek.short)).toBe(true);
    expect(g.branches).toEqual([
      { name: 'petes-world', hash: dalek.hash },
      { name: 'prime-timeline', hash: dalek.hash },
    ]);
    expect(g.tags).toEqual([{ name: 'fixed-point', hash: rose.hash }]);
    expect(g.head).toEqual({ hash: dalek.hash, branch: 'prime-timeline' });
  });

  test('an annotated tag points at its commit', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { git: ['tag', '-a', '-m', 'fixed', 'pompeii'] },
    ]);
    expect(g.tags).toEqual([{ name: 'pompeii', hash: g.commits[0].hash }]);
  });

  test('a detached HEAD has a hash but no branch', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { commit: 'Dalek' },
      { git: ['checkout', '-q', 'HEAD~1'] },
    ]);
    expect(g.head).toEqual({ hash: g.commits[0].hash, branch: null });
  });

  test('a stash does not add phantom commits', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { write: { 'episodes/rose.md': 'changed\n' } },
      { git: ['stash'] },
    ]);
    expect(g.commits.map((c) => c.message)).toEqual(['Rose']);
  });
});
