import { describe, expect, test } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { Tardis } from './Tardis';

const svg = (x: number, durationMs?: number) => (
  <svg aria-label="timeline">
    <Tardis x={x} y={100} durationMs={durationMs} />
  </svg>
);

describe('Tardis', () => {
  test('parks without flying on first render', () => {
    render(svg(40));
    expect(screen.getByTestId('tardis').style.transform).toBe('translate(40px, 100px)');
  });

  test('twirls on its way to a new spot', async () => {
    const { rerender } = render(svg(40, 1000));
    rerender(svg(400, 1000));
    await waitFor(() => expect(screen.getByTestId('tardis').style.transform).toContain('rotate('));
  });

  test('parks on the new spot when the flight ends', async () => {
    const { rerender } = render(svg(40, 30));
    rerender(svg(400, 30));
    await waitFor(() => expect(screen.getByTestId('tardis').style.transform).toBe('translate(400px, 100px)'));
    expect(screen.getByTestId('tardis').style.filter).toBe('');
  });
});
