import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { git } from './git';

const timeline = [{ git: ['init', '-q'] }, { commit: 'Rose' }, { commit: 'Dalek' }];

describe('buildSnapshot', () => {
  test('replays commits in order', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, timeline);
    const { output } = await git(dir, ['log', '--format=%s']);
    expect(output.trim().split('\n')).toEqual(['Dalek', 'Rose']);
  });

  test('produces identical hashes on every build', async () => {
    const [a, b] = [await tmp(), await tmp()];
    await buildSnapshot(a, timeline);
    await buildSnapshot(b, timeline);
    const [ha, hb] = [await git(a, ['rev-parse', 'HEAD']), await git(b, ['rev-parse', 'HEAD'])];
    expect(ha.output).toBe(hb.output);
  });

  test('writes files without needing a repo', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ write: { 'episodes/rose.md': '# Rose\n' } }]);
    expect(await readFile(join(dir, 'episodes/rose.md'), 'utf8')).toBe('# Rose\n');
    expect((await git(dir, ['rev-parse', '--git-dir'])).code).not.toBe(0);
  });

  test('commits the given files instead of the default episode file', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ git: ['init', '-q'] }, { commit: 'Blink', files: { 'angels.txt': "Don't blink\n" } }]);
    const { output } = await git(dir, ['show', '--name-only', '--format=', 'HEAD']);
    expect(output.trim()).toBe('angels.txt');
  });

  test('throws when a git step fails', async () => {
    const dir = await tmp();
    await expect(buildSnapshot(dir, [{ git: ['init', '-q'] }, { git: ['checkout', 'nowhere'] }])).rejects.toThrow(
      'git checkout nowhere failed',
    );
  });

  test('wipes the previous build', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ write: { 'a.txt': 'a' } }]);
    await buildSnapshot(dir, []);
    expect(await Bun.file(join(dir, 'a.txt')).exists()).toBe(false);
  });
});
