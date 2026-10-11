import type { Step } from '../shared/types';

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export function ghost(typed: string, cue: string | undefined): string {
  return cue?.startsWith(typed) ? cue.slice(typed.length) : '';
}

export function advance(steps: Step[], index: number, ran: string, code: number): number {
  const cue = steps[index];
  if (!cue || !('cmd' in cue) || normalize(ran) !== normalize(cue.cmd)) return index;
  return (code === 0) === !cue.fails ? index + 1 : index;
}
