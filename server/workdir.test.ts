import { describe, expect, test } from 'bun:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { git } from './git';
import { classify, InvalidPathError, livePath, readWorkDir } from './workdir';

describe('classify', () => {
  test.each(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'])('%s is conflicted', (xy) => {
    expect(classify(xy)).toBe('conflicted');
  });

  test.each([
    ['??', 'untracked'],
    [' M', 'modified'],
    ['MM', 'modified'],
    ['AM', 'modified'],
    [' D', 'modified'],
    ['M ', 'staged'],
    ['A ', 'staged'],
    ['R ', 'staged'],
  ] as const)('%s is %s', (xy, status) => {
    expect(classify(xy)).toBe(status);
  });
});

describe('readWorkDir', () => {
  test('before git init every file is untracked', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ write: { 'b.md': 'b', 'episodes/a.md': 'a' } }]);
    expect(await readWorkDir(dir)).toEqual({
      merging: false,
      files: [
        { path: 'b.md', status: 'untracked', code: '??' },
        { path: 'episodes/a.md', status: 'untracked', code: '??' },
      ],
    });
  });

  test('lists every file except .git, sorted, with its status', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [
      { git: ['init', '-q'] },
      { commit: 'Rose', files: { 'clean.md': 'c', 'modified.md': 'm', 'staged.md': 's' } },
      { write: { 'modified.md': 'm2', 'staged.md': 's2', 'new/untracked.md': 'u' } },
      { git: ['add', 'staged.md'] },
    ]);
    expect(await readWorkDir(dir)).toEqual({
      merging: false,
      files: [
        { path: 'clean.md', status: 'clean', code: '' },
        { path: 'modified.md', status: 'modified', code: ' M' },
        { path: 'new/untracked.md', status: 'untracked', code: '??' },
        { path: 'staged.md', status: 'staged', code: 'M ' },
      ],
    });
  });

  test('a staged rename lists the new path as staged', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ git: ['init', '-q'] }, { commit: 'Rose', files: { 'old.md': 'x' } }]);
    await git(dir, ['mv', 'old.md', 'new.md']);
    expect((await readWorkDir(dir)).files).toEqual([{ path: 'new.md', status: 'staged', code: 'R ' }]);
  });

  test('a failed merge marks the file conflicted and the repo merging', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [
      { git: ['init', '-q'] },
      { commit: 'Rose', files: { 'TARDIS.md': 'Rose\n' } },
      { git: ['switch', '-q', '-c', 'petes-world'] },
      { commit: "Pete's World", files: { 'TARDIS.md': 'Pete\n' } },
      { git: ['switch', '-q', 'prime-timeline'] },
      { commit: 'Doomsday', files: { 'TARDIS.md': 'Doctor\n' } },
    ]);
    expect((await git(dir, ['merge', 'petes-world'])).code).not.toBe(0);
    expect(await readWorkDir(dir)).toEqual({
      merging: true,
      files: [{ path: 'TARDIS.md', status: 'conflicted', code: 'UU' }],
    });
  });

  test('skips a nested .git directory only at the top level', async () => {
    const dir = await tmp();
    await mkdir(join(dir, 'docs'), { recursive: true });
    await writeFile(join(dir, 'docs/.gitkeep'), '');
    await git(dir, ['init', '-q']);
    expect((await readWorkDir(dir)).files.map((f) => f.path)).toEqual(['docs/.gitkeep']);
  });
});

describe('livePath', () => {
  test('resolves a relative path inside the live dir', () => {
    expect(livePath('/live', 'episodes/rose.md')).toBe('/live/episodes/rose.md');
    expect(livePath('/live', './a.md')).toBe('/live/a.md');
  });

  test.each([
    '',
    '.',
    '..',
    '../escape.md',
    'episodes/../../escape.md',
    'episodes/../rose.md',
    '/etc/passwd',
    '.git',
    '.git/config',
    './.git/HEAD',
    'a\0b',
  ])('rejects %p', (path) => {
    expect(() => livePath('/live', path)).toThrow(InvalidPathError);
  });
});
