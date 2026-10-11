import type { Episode } from '../shared/types';

export function applyEpisode(md: string, { set = {}, event }: Pick<Episode, 'set' | 'event'>): string {
  const lines = md.replace(/\n$/, '').split('\n');
  const blank = lines.indexOf('');
  const fields = blank < 0 ? lines : lines.slice(0, blank);
  const events = blank < 0 ? [] : lines.slice(blank + 1);

  for (const [key, value] of Object.entries(set)) {
    const block = typeof value === 'string' ? [`${key}: ${value}`] : [`${key}:`, ...value.map((v) => `- ${v}`)];
    const at = fields.findIndex((l) => l === `${key}:` || l.startsWith(`${key}: `));
    if (at < 0) {
      fields.push(...block);
      continue;
    }
    let end = at + 1;
    if (fields[at] === `${key}:`) while (fields[end]?.startsWith('- ')) end++;
    fields.splice(at, end - at, ...block);
  }

  if (event) {
    if (events.length === 0) events.push('Events:');
    events.push(`- ${event}`);
  }
  return `${[...fields, ...(events.length ? ['', ...events] : [])].join('\n')}\n`;
}
