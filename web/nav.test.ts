import { describe, expect, test } from 'bun:test';
import { move } from './nav';

const scenes = [{ story: [1, 2] }, { story: [1] }];

describe('move', () => {
  test('forward through cards, then into the git phase', () => {
    expect(move({ scene: 0, card: 0 }, 1, scenes)).toEqual({ scene: 0, card: 1 });
    expect(move({ scene: 0, card: 1 }, 1, scenes)).toEqual({ scene: 0, card: 2 });
  });
  test('forward from the git phase starts the next scene', () => {
    expect(move({ scene: 0, card: 2 }, 1, scenes)).toEqual({ scene: 1, card: 0 });
  });
  test('forward stops at the last git phase', () => {
    expect(move({ scene: 1, card: 1 }, 1, scenes)).toEqual({ scene: 1, card: 1 });
  });
  test('back from the first card lands on the previous git phase', () => {
    expect(move({ scene: 1, card: 0 }, -1, scenes)).toEqual({ scene: 0, card: 2 });
  });
  test('back stops at the very first card', () => {
    expect(move({ scene: 0, card: 0 }, -1, scenes)).toEqual({ scene: 0, card: 0 });
  });
});
