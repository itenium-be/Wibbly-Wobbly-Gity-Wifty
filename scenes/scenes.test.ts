import { describe, expect, test } from 'bun:test';
import { scenes } from '.';

describe('scenes', () => {
  test('ids are unique', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });
});
