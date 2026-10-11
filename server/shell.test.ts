import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { sh } from './shell';

describe('sh', () => {
  test('runs a full shell line, pipes included', async () => {
    const dir = await tmp();
    await Bun.write(join(dir, 'TARDIS.md'), 'Doctor: Nine\nCompanion: Rose\n');
    expect(await sh(dir, 'cat TARDIS.md | head -1')).toEqual({ output: 'Doctor: Nine\n', code: 0 });
  });

  test('returns the exit code and stderr', async () => {
    const dir = await tmp();
    const { code, output } = await sh(dir, 'git status');
    expect(code).not.toBe(0);
    expect(output).toContain('not a git repository');
  });

  test('git uses the given global config', async () => {
    const dir = await tmp();
    const config = `${dir}.gitconfig`;
    await Bun.write(config, '[user]\n\tname = Rose Tyler\n');
    expect((await sh(dir, 'git config --global user.name', { config })).output).toBe('Rose Tyler\n');
    await sh(dir, 'git config --global alias.st status', { config });
    expect(await Bun.file(config).text()).toContain('st = status');
  });

  test('applies a fixed date to commits', async () => {
    const dir = await tmp();
    await sh(dir, 'git init -q && git commit -q --allow-empty -m Rose', { date: '@1111863600 +0000' });
    expect((await sh(dir, 'git log -1 --format=%at')).output).toBe('1111863600\n');
  });

  test('never waits for a pager or an editor', async () => {
    const dir = await tmp();
    await sh(dir, 'git init -q && git commit -q --allow-empty -m Rose');
    expect((await sh(dir, 'git commit --allow-empty')).code).not.toBe(0);
    expect((await sh(dir, 'echo $PAGER $GIT_PAGER')).output).toBe('cat cat\n');
  });

  test('colours git output only when asked', async () => {
    const dir = await tmp();
    await sh(dir, 'git init -q && git commit -q --allow-empty -m Rose');
    expect((await sh(dir, 'git log --oneline --decorate')).output).not.toContain('\x1b[');
    expect((await sh(dir, 'git log --oneline --decorate', { color: true })).output).toContain('\x1b[33m');
  });

  test('kills a line that runs too long', async () => {
    const dir = await tmp();
    const { output } = await sh(dir, 'sleep 5', {}, 200);
    expect(output).toContain('`sleep 5` timed out after 0.2s');
  });

  test('kills the whole process group, not just bash', async () => {
    const dir = await tmp();
    const start = Date.now();
    const { output } = await sh(dir, 'sleep 5 | cat', {}, 200);
    expect(Date.now() - start).toBeLessThan(1500);
    expect(output).toContain('timed out after 0.2s');
  });
});
