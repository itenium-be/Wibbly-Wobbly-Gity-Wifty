import { describe, expect, test } from 'bun:test';
import type { Step } from '../shared/types';
import { advance, type Cue, current, ghost } from './cue';

const at = (index: number): Cue => ({ index, done: [], last: '' });

describe('ghost', () => {
  test('shows the whole cue when nothing is typed', () => {
    expect(ghost('', 'git log')).toBe('git log');
  });
  test('shows the rest of the cue while the typed text matches', () => {
    expect(ghost('git rebase prime-t', 'git rebase prime-timeline')).toBe('imeline');
  });
  test('shows nothing once the typed text diverges', () => {
    expect(ghost('git lag', 'git log')).toBe('');
  });
  test('shows nothing without a cue', () => {
    expect(ghost('git', undefined)).toBe('');
  });
});

describe('advance', () => {
  const steps: Step[] = [
    { cmd: 'git init', caption: '' },
    { cmd: 'git commit -m "Rose"', caption: '' },
  ];
  test('moves on when the cued command succeeds', () => {
    expect(advance(steps, at(0), 'git init', 0).index).toBe(1);
  });
  test('ignores whitespace differences', () => {
    expect(advance(steps, at(1), '  git commit   -m "Rose" ', 0).index).toBe(2);
  });
  test('stays when the command failed', () => {
    expect(advance(steps, at(0), 'git init', 128).index).toBe(0);
  });
  test('stays on an off-script command', () => {
    expect(advance(steps, at(0), 'git status', 0).index).toBe(0);
  });
  test('stays past the last step', () => {
    expect(advance(steps, at(2), 'git init', 0).index).toBe(2);
  });
});

describe('advance with fails and episodes', () => {
  test('a cue expected to fail moves on when it fails, not when it succeeds', () => {
    const steps = [{ cmd: 'git status', caption: '', fails: true as const }];
    expect(advance(steps, at(0), 'git status', 128).index).toBe(1);
    expect(advance(steps, at(0), 'git status', 0).index).toBe(0);
  });

  test('typing never moves past an episode step', () => {
    const steps = [{ episode: { code: 'S01E02', title: 'The End of the World' } }];
    expect(advance(steps, at(0), 'git log', 0).index).toBe(0);
  });
});

describe('accepts', () => {
  const steps: Step[] = [{ cmd: 'git add TARDIS.md', caption: '', accepts: 'git add' }];
  test('another command with the accepted prefix moves on', () => {
    expect(advance(steps, at(0), 'git add .', 0).index).toBe(1);
  });
  test('a command that only starts with the same letters does not', () => {
    expect(advance(steps, at(0), 'git addendum', 0).index).toBe(0);
  });
});

describe('after', () => {
  const steps: Step[] = [
    { cmd: 'git init', caption: '' },
    { cmd: 'git config --global alias.st status', caption: '', after: 'git status' },
    { cmd: 'git add TARDIS.md', caption: '' },
  ];
  test('is skipped until its trigger was typed', () => {
    expect(current(steps, at(1))).toBe(2);
  });
  test('is cued right after its trigger, wherever the story is', () => {
    const cue = advance(steps, at(2), 'git status', 0);
    expect(current(steps, cue)).toBe(1);
  });
  test('once done it is not cued again, and the story continues where it was', () => {
    const cue = advance(steps, advance(steps, at(2), 'git status', 0), 'git config --global alias.st status', 0);
    expect(current(steps, cue)).toBe(2);
    expect(current(steps, advance(steps, cue, 'git status', 0))).toBe(2);
  });
  test('the story cue still works while the triggered cue is showing', () => {
    const cue = advance(steps, advance(steps, at(2), 'git status', 0), 'git add TARDIS.md', 0);
    expect(cue.index).toBe(3);
  });
});
