import type { BlameHunk } from '../shared/types';

type Info = Omit<BlameHunk, 'lines'>;

/** `git blame --porcelain` only writes a commit's headers the first time that commit appears. */
export function parseBlame(porcelain: string): BlameHunk[] {
  const commits = new Map<string, Info>();
  const hunks: BlameHunk[] = [];
  let info: Info | undefined;
  for (const line of porcelain.split('\n')) {
    if (line.startsWith('\t')) {
      if (!info) continue;
      const last = hunks.at(-1);
      if (last?.hash === info.hash) last.lines.push(line.slice(1));
      else hunks.push({ ...info, lines: [line.slice(1)] });
      continue;
    }
    const header = /^([0-9a-f]{40}) \d+ \d+/.exec(line);
    if (header) {
      const hash = header[1] as string;
      info = commits.get(hash) ?? { hash, author: '', date: '', summary: '' };
      commits.set(hash, info);
      continue;
    }
    if (!info) continue;
    const [key, ...rest] = line.split(' ');
    const value = rest.join(' ');
    if (key === 'author') info.author = value;
    else if (key === 'author-time') info.date = new Date(Number(value) * 1000).toISOString().slice(0, 10);
    else if (key === 'summary') info.summary = value;
  }
  return hunks;
}
