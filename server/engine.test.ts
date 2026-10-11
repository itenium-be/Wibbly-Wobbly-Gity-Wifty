import { beforeAll, describe, expect, test } from 'bun:test';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { Engine } from './engine';

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
    expect((await engine.enter('dalek')).commits.map((c) => c.message)).toEqual(['Rose', 'Dalek']);
  });

  test('runs git in the live repo and returns the new graph', async () => {
    await engine.enter('rose');
    const result = await engine.run('git commit --allow-empty -m "The End of the World"');
    expect(result.code).toBe(0);
    expect(result.graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
  });

  test('re-entering a scene resets it', async () => {
    await engine.enter('rose');
    await engine.run('git commit --allow-empty -m "Changed"');
    expect((await engine.enter('rose')).commits).toHaveLength(1);
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
});
