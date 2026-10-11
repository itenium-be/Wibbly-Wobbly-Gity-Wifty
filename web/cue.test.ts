import { describe, expect, test } from 'bun:test';
import { advance, ghost } from './cue';

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
  const steps = [
    { cmd: 'git init', caption: '' },
    { cmd: 'git commit -m "Rose"', caption: '' },
  ];
  test('moves on when the cued command succeeds', () => {
    expect(advance(steps, 0, 'git init', 0)).toBe(1);
  });
  test('ignores whitespace differences', () => {
    expect(advance(steps, 1, '  git commit   -m "Rose" ', 0)).toBe(2);
  });
  test('stays when the command failed', () => {
    expect(advance(steps, 0, 'git init', 128)).toBe(0);
  });
  test('stays on an off-script command', () => {
    expect(advance(steps, 0, 'git status', 0)).toBe(0);
  });
  test('stays past the last step', () => {
    expect(advance(steps, 2, 'git init', 0)).toBe(2);
  });
});
