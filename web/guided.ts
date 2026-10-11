import type { Step } from '../shared/types';

/** Guided: every step shows its command as ghost text, so Tab + Enter plays it. */
export const GUIDED_MODE = true;

const KEY = 'guided-mode';

export function loadGuided(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === null ? GUIDED_MODE : saved === 'true';
  } catch {
    return GUIDED_MODE;
  }
}

export function saveGuided(on: boolean): void {
  try {
    localStorage.setItem(KEY, String(on));
  } catch {
    // Private windows can refuse storage; the toggle then lasts until reload.
  }
}

export const hinted = (guided: boolean, step: Step | undefined, revealed: boolean): boolean =>
  guided || revealed || (!!step && 'cmd' in step && !!step.hint);
