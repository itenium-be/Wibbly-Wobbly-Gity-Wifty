import { describe, expect, test } from 'bun:test';
import { buildSnapshot } from '../server/build';
import { tokenize } from '../server/command';
import { git } from '../server/git';
import { tmp } from '../test/tmp';
import { scenes } from '.';

async function replay(dir: string, cmds: string[]) {
  for (const cmd of cmds) {
    const parsed = tokenize(cmd);
    if (!parsed.ok) throw new Error(parsed.error);
    const { code, output } = await git(dir, parsed.args);
    expect({ cmd, code, output }).toMatchObject({ code: 0 });
  }
}

describe('scenes', () => {
  test('ids are unique', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });

  for (const scene of scenes) {
    test(`${scene.id}: every cue runs cleanly against its snapshot`, async () => {
      const dir = await tmp();
      await buildSnapshot(dir, scene.build ?? []);
      await replay(
        dir,
        scene.steps.flatMap((s) => ('cmd' in s ? [s.cmd] : [])),
      );
    });
  }

  test('fixed-points: the tag lands on The Fires of Pompeii', async () => {
    const scene = scenes.find((s) => s.id === 'fixed-points');
    if (!scene) throw new Error('fixed-points scene missing');
    const dir = await tmp();
    await buildSnapshot(dir, scene.build ?? []);
    await replay(dir, ['git tag fixed-point/pompeii HEAD~2']);
    const { output } = await git(dir, ['log', '-1', '--format=%s', 'fixed-point/pompeii']);
    expect(output.trim()).toBe('The Fires of Pompeii');
  });
});
