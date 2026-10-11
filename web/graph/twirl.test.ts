import { describe, expect, test } from 'bun:test';
import { twirl } from './twirl';

const from = { x: 100, y: 300 };
const to = { x: 500, y: 300 };

describe('twirl', () => {
  test('takes off upright and facing front', () => {
    expect(twirl(0, from, to)).toEqual({ x: 100, y: 300, rot: 0, turn: 1 });
  });

  test('lands upright and facing front on the target', () => {
    const end = twirl(1, from, to);
    expect(end.x).toBe(500);
    expect(end.y).toBeCloseTo(300);
    expect(end.rot).toBeCloseTo(0);
    expect(end.turn).toBeCloseTo(1);
  });

  test('peaks 140 above the midpoint', () => {
    const mid = twirl(0.5, from, to);
    expect(mid.x).toBe(300);
    expect(mid.y).toBeCloseTo(160);
  });

  test('shows its back and wobbles mid-flight', () => {
    const turns = Array.from({ length: 99 }, (_, i) => twirl((i + 1) / 100, from, to));
    expect(Math.min(...turns.map((p) => p.turn))).toBeLessThan(-0.9);
    expect(Math.max(...turns.map((p) => Math.abs(p.rot)))).toBeGreaterThan(15);
  });
});
