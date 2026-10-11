import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { FlatTimeline } from './FlatTimeline';
import { layout } from './layout';

const pompeii = layout({
  initialized: true,
  commits: [
    { hash: 'a1', short: 'a1', message: 'The Fires of Pompeii', parents: [] },
    { hash: 'b2', short: 'b2', message: 'Planet of the Ood', parents: ['a1'] },
  ],
  branches: [{ name: 'prime-timeline', hash: 'b2' }],
  tags: [{ name: 'fixed-point/pompeii', hash: 'a1' }],
  head: { hash: 'a1', branch: null },
});

describe('FlatTimeline', () => {
  test('draws episodes, lane, tag, branch and HEAD', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByText('The Fires of Pompeii')).toBeTruthy();
    expect(screen.getByText('Planet of the Ood')).toBeTruthy();
    expect(screen.getByText('⚑ fixed-point/pompeii')).toBeTruthy();
    expect(screen.getAllByText('prime-timeline')).toHaveLength(2); // lane label + branch pill
    expect(screen.getByText('HEAD (detached)')).toBeTruthy();
  });

  test('labels a commit with its episode code, title and hash, in that order', () => {
    render(<FlatTimeline layout={pompeii} codes={{ 'The Fires of Pompeii': 'S04E02' }} />);
    const y = (text: string) => Number(screen.getByText(text).getAttribute('y'));
    expect(y('S04E02')).toBeLessThan(y('The Fires of Pompeii'));
    expect(y('The Fires of Pompeii')).toBeLessThan(y('a1'));
  });

  test('draws tag labels below the commit so the TARDIS cannot hide them', () => {
    render(<FlatTimeline layout={pompeii} />);
    const y = Number(screen.getByText('⚑ fixed-point/pompeii').getAttribute('y'));
    expect(y).toBeGreaterThan(200);
  });

  test('parks the TARDIS on the HEAD commit', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByTestId('tardis').style.transform).toBe('translate(260px, 160px)');
  });

  test('an empty timeline says so', () => {
    render(
      <FlatTimeline
        layout={layout({ initialized: true, commits: [], branches: [], tags: [], head: { hash: null, branch: null } })}
      />,
    );
    expect(screen.getByText('An empty timeline')).toBeTruthy();
  });

  test('before git init the timeline is blank', () => {
    const { container } = render(
      <FlatTimeline
        layout={layout({ initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } })}
      />,
    );
    expect(container.querySelector('.empty')).toBeNull();
  });

  test('fills its container at zoom 1 and scales with the zoom factor', () => {
    const { rerender } = render(<FlatTimeline layout={pompeii} />);
    const svg = screen.getByRole('img', { name: 'timeline' });
    expect(svg.style.width).toBe('100%');
    rerender(<FlatTimeline layout={pompeii} zoom={2} />);
    expect(svg.style.width).toBe('200%');
    expect(svg.style.height).toBe('200%');
  });

  test('draws the pending node as uncommitted', () => {
    render(<FlatTimeline layout={{ ...pompeii, pending: { col: 2, lane: 0, from: { col: 1, lane: 0 } } }} />);
    expect(screen.getByText('uncommitted')).toBeTruthy();
  });
});
