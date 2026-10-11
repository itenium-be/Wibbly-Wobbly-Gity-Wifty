import { lstat } from 'node:fs/promises';
import { isAbsolute, join, normalize } from 'node:path';
import type { FileStatus, WorkDir } from '../shared/types';
import { git } from './git';

export class InvalidPathError extends Error {}

async function isSymlink(path: string) {
  try {
    return (await lstat(path)).isSymbolicLink();
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw e;
  }
}

export async function livePath(root: string, path: string): Promise<string> {
  const rel = normalize(path);
  const segments = rel.split('/');
  if (path.includes('\0') || isAbsolute(path) || path.split('/').includes('..') || ['.', '.git'].includes(segments[0]))
    throw new InvalidPathError(`invalid path: ${path}`);
  // A symlink anywhere along the path could lead outside the live dir or into .git.
  for (let i = 1; i <= segments.length; i++) {
    if (await isSymlink(join(root, ...segments.slice(0, i)))) throw new InvalidPathError(`symlink in path: ${path}`);
  }
  return join(root, rel);
}

const UNMERGED = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

export function classify(xy: string): FileStatus {
  if (UNMERGED.has(xy)) return 'conflicted';
  if (xy === '??') return 'untracked';
  return xy[1] !== ' ' ? 'modified' : 'staged';
}

async function statusCodes(dir: string): Promise<Map<string, string> | null> {
  const { output, code } = await git(dir, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  if (code !== 0) return null;
  const codes = new Map<string, string>();
  const entries = output.split('\0');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const xy = entry.slice(0, 2);
    codes.set(entry.slice(3), xy);
    // A rename or copy is followed by its source path as a separate entry.
    if (/[RC]/.test(xy)) i++;
  }
  return codes;
}

export async function readWorkDir(dir: string): Promise<WorkDir> {
  const paths: string[] = [];
  for await (const path of new Bun.Glob('**').scan({ cwd: dir, dot: true, onlyFiles: true })) {
    if (!path.startsWith('.git/')) paths.push(path);
  }
  paths.sort();

  const codes = await statusCodes(dir);
  const files = paths.map((path) => {
    const code = codes ? (codes.get(path) ?? '') : '??';
    return { path, code, status: code ? classify(code) : ('clean' as const) };
  });
  return { files, merging: await Bun.file(join(dir, '.git', 'MERGE_HEAD')).exists() };
}
