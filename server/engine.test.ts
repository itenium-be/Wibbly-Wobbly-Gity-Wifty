import { beforeAll, describe, expect, test } from 'bun:test';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { Engine } from './engine';
import { InvalidPathError } from './workdir';

const scene = (id: string, commits: string[]): Scene => ({
  id,
  episode: 'S01E01',
  title: id,
  story: [],
  build: [{ git: ['init', '-q'] }, ...commits.map((commit) => ({ commit }))],
  steps: [],
});

describe('Engine', () => {
  let engine: Engine;
  beforeAll(async () => {
    engine = new Engine(await tmp(), [scene('rose', ['Rose']), scene('dalek', ['Rose', 'Dalek'])]);
    await engine.prepare();
  });

  test('entering a scene loads its snapshot', async () => {
    expect((await engine.enter('dalek')).graph.commits.map((c) => c.message)).toEqual(['Rose', 'Dalek']);
  });

  test('runs git in the live repo and returns the new graph', async () => {
    await engine.enter('rose');
    const result = await engine.run('git commit --allow-empty -m "The End of the World"');
    expect(result.code).toBe(0);
    expect(result.graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
  });

  test('entering a scene and running a command return the working directory', async () => {
    expect((await engine.enter('rose')).workdir.files).toEqual([
      { path: 'episodes/rose.md', status: 'clean', code: '' },
    ]);
    const result = await engine.run('git rm -q --cached episodes/rose.md');
    expect(result.workdir.files).toEqual([{ path: 'episodes/rose.md', status: 'untracked', code: '??' }]);
  });

  test('reads a file from the live dir', async () => {
    await engine.enter('rose');
    expect(await engine.readFile('episodes/rose.md')).toBe('# Rose\n');
  });

  test('writing a file returns the updated working directory', async () => {
    await engine.enter('rose');
    const workdir = await engine.writeFile('episodes/rose.md', '# Bad Wolf\n');
    expect(workdir.files).toEqual([{ path: 'episodes/rose.md', status: 'modified', code: ' M' }]);
    expect(await engine.readFile('episodes/rose.md')).toBe('# Bad Wolf\n');
  });

  test('writing a new file creates its directories', async () => {
    await engine.enter('rose');
    const workdir = await engine.writeFile('companions/jack.md', 'Jack\n');
    expect(workdir.files).toContainEqual({ path: 'companions/jack.md', status: 'untracked', code: '??' });
  });

  test('rejects paths outside the live dir', async () => {
    await expect(engine.readFile('../snapshots/rose/episodes/rose.md')).rejects.toBeInstanceOf(InvalidPathError);
    await expect(engine.writeFile('.git/HEAD', 'x')).rejects.toBeInstanceOf(InvalidPathError);
  });

  test('re-entering a scene resets it', async () => {
    await engine.enter('rose');
    await engine.run('git commit --allow-empty -m "Changed"');
    expect((await engine.enter('rose')).graph.commits).toHaveLength(1);
  });

  test('rejects non-git input without running it', async () => {
    await engine.enter('rose');
    const result = await engine.run('ls');
    expect(result).toMatchObject({ code: 1, output: 'only git commands travel in this TARDIS' });
    expect(result.graph.commits).toHaveLength(1);
  });

  test('entering an unknown scene throws and keeps the current live repo', async () => {
    await engine.enter('dalek');
    await expect(engine.enter('nope')).rejects.toThrow('unknown scene: nope');
    expect((await engine.run('git log --format=%s')).output).toBe('Dalek\nRose\n');
  });

  test('concurrent enters are serialised and the live repo matches the last one', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 'rose' : 'dalek'));
    const graphs = await Promise.all(ids.map((id) => engine.enter(id)));
    expect(graphs.map((g) => g.graph.commits.length)).toEqual(ids.map((id) => (id === 'rose' ? 1 : 2)));
    expect((await engine.run('git log --format=%s')).output).toBe('Dalek\nRose\n');
  });

  test('a failed call does not poison the queue', async () => {
    const [bad, good] = await Promise.allSettled([engine.enter('nope'), engine.enter('rose')]);
    expect(bad.status).toBe('rejected');
    expect(good.status).toBe('fulfilled');
  });
});
