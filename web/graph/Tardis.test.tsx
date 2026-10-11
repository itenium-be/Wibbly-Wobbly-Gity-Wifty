import { describe, expect, test } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import { Tardis } from './Tardis';

const svg = (x: number, durationMs?: number, label?: string) => (
  <svg aria-label="timeline">
    <Tardis x={x} y={100} durationMs={durationMs} label={label} />
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
    await waitFor(() => expect(screen.getByTestId('tardis-box').style.transform).toContain('rotate('));
  });

  test('carries its label along, upright', async () => {
    const { rerender } = render(svg(40, 1000, 'HEAD → prime-timeline'));
    rerender(svg(400, 1000, 'HEAD → prime-timeline'));
    await waitFor(() => expect(screen.getByTestId('tardis').style.transform).not.toBe('translate(40px, 100px)'));
    const label = screen.getByText('HEAD → prime-timeline');
    expect(screen.getByTestId('tardis').contains(label)).toBe(true);
    expect(screen.getByTestId('tardis-box').contains(label)).toBe(false);
    expect(screen.getByTestId('tardis').style.transform).not.toContain('rotate(');
  });

  test('parks on the new spot when the flight ends', async () => {
    const { rerender } = render(svg(40, 30));
    rerender(svg(400, 30));
    await waitFor(() => expect(screen.getByTestId('tardis').style.transform).toBe('translate(400px, 100px)'));
    expect(screen.getByTestId('tardis-box').style.transform).toBe('');
    expect(screen.getByTestId('tardis-box').style.filter).toBe('');
  });
});
