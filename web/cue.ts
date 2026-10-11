import type { CmdStep, Step } from '../shared/types';

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export function ghost(typed: string, cue: string | undefined): string {
  return cue?.startsWith(typed) ? cue.slice(typed.length) : '';
}

/** `index`: the story's place. `done`: triggered steps already played. `last`: the last command run. */
export type Cue = { index: number; done: number[]; last: string };

export const start: Cue = { index: 0, done: [], last: '' };

const triggered = (step: Step | undefined): step is CmdStep & { after: string } =>
  !!step && 'cmd' in step && !!step.after;

function triggeredCue(steps: Step[], cue: Cue): number | undefined {
  const at = steps.findIndex(
    (s, i) => triggered(s) && !cue.done.includes(i) && normalize(s.after) === normalize(cue.last),
  );
  return at >= 0 ? at : undefined;
}

function storyCue(steps: Step[], cue: Cue): number {
  let i = cue.index;
  while (triggered(steps[i])) i++;
  return i;
}

export function current(steps: Step[], cue: Cue): number {
  return triggeredCue(steps, cue) ?? storyCue(steps, cue);
}

function matches(step: Step | undefined, ran: string, code: number): boolean {
  if (!step || !('cmd' in step)) return false;
  const typed = normalize(ran);
  const accepted =
    typed === normalize(step.cmd) ||
    (step.accepts !== undefined && `${typed} `.startsWith(`${normalize(step.accepts)} `));
  return accepted && (code === 0) === !step.fails;
}

export function advance(steps: Step[], cue: Cue, ran: string, code: number): Cue {
  const next = { ...cue, last: ran };
  const t = triggeredCue(steps, cue);
  if (t !== undefined && matches(steps[t], ran, code)) return { ...next, done: [...cue.done, t] };
  const s = storyCue(steps, cue);
  return matches(steps[s], ran, code) ? { ...next, index: s + 1 } : next;
}

/** After the cued episode or edit is played. */
export const played = (steps: Step[], cue: Cue): Cue => ({ ...cue, index: storyCue(steps, cue) + 1 });
