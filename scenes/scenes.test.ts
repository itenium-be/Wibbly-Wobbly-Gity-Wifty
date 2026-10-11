import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { Engine } from '../server/engine';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { scenes } from '.';

async function playScene(engine: Engine, scene: Scene) {
  await engine.enter(scene.id);
  for (const step of scene.steps) {
    if ('cmd' in step) await engine.run(step.cmd);
    else await engine.episode(step.episode.code);
  }
}

describe('scenes', () => {
  let engine: Engine;
  beforeAll(async () => {
    engine = new Engine(await tmp(), scenes);
    // prepare plays every step of every scene and throws on an unexpected exit code.
    await engine.prepare();
  });

  test('ids are unique', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });

  test('episode titles survive double quotes in bash', () => {
    const titles = scenes.flatMap((s) => s.steps.flatMap((step) => ('episode' in step ? [step.episode.title] : [])));
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(title).not.toMatch(/["$`\\]/);
  });

  test('rose starts with an untracked TARDIS log and no repo', async () => {
    const { graph, workdir } = await engine.enter('rose');
    expect(graph.initialized).toBe(false);
    expect(await engine.readFile('TARDIS.md')).toContain('Companion: Rose Tyler');
    expect(workdir.files.map((f) => f.path)).toEqual(['TARDIS.md']);
  });

  test('pompeii starts where Rose ended, st alias included', async () => {
    const { graph } = await engine.enter('fixed-points');
    expect(graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
    expect((await engine.run('git st')).code).toBe(0);
  });

  test('the fixed point lands on The Fires of Pompeii and checking it out shows Pompeii', async () => {
    const scene = scenes.find((s) => s.id === 'fixed-points') as Scene;
    await playScene(engine, scene);
    expect((await engine.run('git log -1 --format=%s fixed-point/pompeii')).output).toBe('The Fires of Pompeii\n');
    expect((await engine.run('git show fixed-point/pompeii:TARDIS.md')).output).toContain('Location: Pompeii');
  });

  test('the Bad Wolf thread runs through the automatic episodes', async () => {
    const scene = scenes.find((s) => s.id === 'fixed-points') as Scene;
    await playScene(engine, scene);
    expect((await engine.run('git log -S "Bad Wolf" --format=%s')).output).toBe(
      'Dalek\nAliens of London\nThe End of the World\n',
    );
  });

  test('the checked-in git config is never written to', async () => {
    expect(await Bun.file(join(import.meta.dir, '../server/tardis.gitconfig')).text()).not.toContain('alias');
  });
});
