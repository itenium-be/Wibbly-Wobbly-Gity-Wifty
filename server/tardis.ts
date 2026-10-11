import type { Episode } from '../shared/types';

const FIELD = /^[A-Z][A-Za-z ]*: /;

export function applyEpisode(md: string, { set = {}, note }: Pick<Episode, 'set' | 'note'>): string {
  const lines = md.replace(/\n$/, '').split('\n');
  for (const [key, value] of Object.entries(set)) {
    const line = `${key}: ${value}`;
    const at = lines.findIndex((l) => l.startsWith(`${key}: `));
    if (at >= 0) lines[at] = line;
    else lines.splice(lines.findLastIndex((l) => FIELD.test(l)) + 1, 0, line);
  }
  if (note) lines.push(note);
  return `${lines.join('\n')}\n`;
}
