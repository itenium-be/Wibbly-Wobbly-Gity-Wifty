import { describe, expect, test } from 'bun:test';
import { fromQuery, move, toQuery } from './nav';

const card = { images: [1] };
const scenes = [{ story: [card, card] }, { story: [card] }];

describe('move', () => {
  test('forward through cards, then into the git phase', () => {
    expect(move({ scene: 0, card: 0, step: 0 }, 1, scenes)).toEqual({ scene: 0, card: 1, step: 0 });
    expect(move({ scene: 0, card: 1, step: 0 }, 1, scenes)).toEqual({ scene: 0, card: 2, step: 0 });
  });
  test('forward from the git phase starts the next scene', () => {
    expect(move({ scene: 0, card: 2, step: 0 }, 1, scenes)).toEqual({ scene: 1, card: 0, step: 0 });
  });
  test('forward stops at the last git phase', () => {
    expect(move({ scene: 1, card: 1, step: 0 }, 1, scenes)).toEqual({ scene: 1, card: 1, step: 0 });
  });
  test('back from the first card lands on the previous git phase', () => {
    expect(move({ scene: 1, card: 0, step: 0 }, -1, scenes)).toEqual({ scene: 0, card: 2, step: 0 });
  });
  test('back stops at the very first card', () => {
    expect(move({ scene: 0, card: 0, step: 0 }, -1, scenes)).toEqual({ scene: 0, card: 0, step: 0 });
  });

  describe('reveal card', () => {
    const reveal = { images: [1, 2], reveal: true };
    const withReveal = [{ story: [reveal, card] }];

    test('forward steps through its images before the next card', () => {
      expect(move({ scene: 0, card: 0, step: 0 }, 1, withReveal)).toEqual({ scene: 0, card: 0, step: 1 });
      expect(move({ scene: 0, card: 0, step: 1 }, 1, withReveal)).toEqual({ scene: 0, card: 1, step: 0 });
    });
    test('back steps through its images before the previous card', () => {
      expect(move({ scene: 0, card: 0, step: 1 }, -1, withReveal)).toEqual({ scene: 0, card: 0, step: 0 });
    });
    test('back into it lands on its last image', () => {
      expect(move({ scene: 0, card: 1, step: 0 }, -1, withReveal)).toEqual({ scene: 0, card: 0, step: 1 });
    });
  });

  describe('boxes', () => {
    const boxed = { images: [1], boxes: [['a', 'b'], ['c'], ['d']] };
    const withBoxes = [{ story: [boxed, card] }];

    test('forward reveals each group after the first before the next card', () => {
      expect(move({ scene: 0, card: 0, step: 0 }, 1, withBoxes)).toEqual({ scene: 0, card: 0, step: 1 });
      expect(move({ scene: 0, card: 0, step: 2 }, 1, withBoxes)).toEqual({ scene: 0, card: 1, step: 0 });
    });
    test('back into it lands with every group shown', () => {
      expect(move({ scene: 0, card: 1, step: 0 }, -1, withBoxes)).toEqual({ scene: 0, card: 0, step: 2 });
    });
    test('on a reveal card they come after its images', () => {
      const both = [{ story: [{ ...boxed, images: [1, 2], reveal: true }] }];
      expect(move({ scene: 0, card: 1, step: 0 }, -1, both)).toEqual({ scene: 0, card: 0, step: 3 });
    });
  });

  test('a rotating card is a single step', () => {
    const rotating = [{ story: [{ images: [1, 2, 3] }, card] }];
    expect(move({ scene: 0, card: 0, step: 0 }, 1, rotating)).toEqual({ scene: 0, card: 1, step: 0 });
    expect(move({ scene: 0, card: 1, step: 0 }, -1, rotating)).toEqual({ scene: 0, card: 0, step: 0 });
  });
});

describe('query string', () => {
  const named = [
    { id: 'rose', story: [card, card] },
    { id: 'dalek', story: [card] },
  ];

  test('encodes the scene id and card', () => {
    expect(toQuery({ scene: 1, card: 1, step: 0 }, named)).toBe('?scene=dalek&card=1');
  });

  test('decodes a position by scene id', () => {
    expect(fromQuery('?scene=dalek&card=1', named)).toEqual({ scene: 1, card: 1, step: 0 });
  });

  test('clamps the card into the scene, git phase included', () => {
    expect(fromQuery('?scene=rose&card=99', named)).toEqual({ scene: 0, card: 2, step: 0 });
    expect(fromQuery('?scene=rose&card=-3', named)).toEqual({ scene: 0, card: 0, step: 0 });
    expect(fromQuery('?scene=rose&card=two', named)).toEqual({ scene: 0, card: 0, step: 0 });
  });

  test('an unknown or missing scene starts at the beginning', () => {
    expect(fromQuery('?scene=nope&card=1', named)).toEqual({ scene: 0, card: 0, step: 0 });
    expect(fromQuery('', named)).toEqual({ scene: 0, card: 0, step: 0 });
  });
});
