import { describe, expect, test } from 'bun:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { git } from './git';

describe('git', () => {
  test('uses the TARDIS identity, not the presenter identity', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    const { output } = await git(dir, ['config', 'user.name']);
    expect(output.trim()).toBe('The Doctor');
  });

  test('initialises repos on prime-timeline', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    const { output } = await git(dir, ['symbolic-ref', '--short', 'HEAD']);
    expect(output.trim()).toBe('prime-timeline');
  });

  test('does not resolve an enclosing repo', async () => {
    const outer = await tmp();
    await git(outer, ['init', '-q']);
    const inner = join(outer, 'live');
    await mkdir(inner);
    const { code } = await git(inner, ['rev-parse', '--git-dir']);
    expect(code).not.toBe(0);
  });

  test('applies a fixed date', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    await git(dir, ['commit', '-q', '--allow-empty', '-m', 'Rose'], '@1111863600 +0000');
    const { output } = await git(dir, ['log', '-1', '--format=%at']);
    expect(output.trim()).toBe('1111863600');
  });

  test('returns the exit code and stderr of a failing command', async () => {
    const dir = await tmp();
    const { code, output } = await git(dir, ['log']);
    expect(code).not.toBe(0);
    expect(output).toContain('not a git repository');
  });

  test('ignores the presenter global ignore file', async () => {
    const home = await tmp();
    await mkdir(join(home, '.config/git'), { recursive: true });
    await writeFile(join(home, '.config/git/ignore'), '*.md\n');
    const realHome = process.env.HOME;
    process.env.HOME = home;
    try {
      const dir = await tmp();
      await buildSnapshot(dir, [{ git: ['init', '-q'] }, { commit: 'Rose' }]);
      const { output } = await git(dir, ['ls-files']);
      expect(output.trim()).toBe('episodes/rose.md');
    } finally {
      process.env.HOME = realHome;
    }
  });
});
