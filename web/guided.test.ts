import { beforeEach, describe, expect, test } from 'bun:test';
import { GUIDED_MODE, hinted, loadGuided, saveGuided } from './guided';

const plain = { cmd: 'git log', caption: 'Where is the TARDIS?' };
const flagged = { ...plain, hint: true as const };

beforeEach(() => localStorage.clear());

describe('guided mode', () => {
  test('defaults to GUIDED_MODE, which is on', () => {
    expect(GUIDED_MODE).toBe(true);
    expect(loadGuided()).toBe(true);
  });

  test('remembers the last saved value', () => {
    saveGuided(false);
    expect(loadGuided()).toBe(false);
    saveGuided(true);
    expect(loadGuided()).toBe(true);
  });

  test('guided shows every hint', () => {
    expect(hinted(true, plain, false)).toBe(true);
  });

  test('unguided shows only flagged or revealed hints', () => {
    expect(hinted(false, plain, false)).toBe(false);
    expect(hinted(false, flagged, false)).toBe(true);
    expect(hinted(false, plain, true)).toBe(true);
  });
});
