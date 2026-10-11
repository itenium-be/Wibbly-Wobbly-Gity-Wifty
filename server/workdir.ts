import { join } from 'node:path';
import type { FileStatus, WorkDir } from '../shared/types';
import { git } from './git';

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
    if (xy[0] === 'R' || xy[0] === 'C') i++;
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
