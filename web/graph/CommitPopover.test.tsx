import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GraphModel } from '../../shared/types';
import { CommitPopover } from './CommitPopover';

const graph: GraphModel = {
  initialized: true,
  commits: [{ hash: 'bbb000000000', short: 'bbb', message: 'Pete lives', parents: [] }],
  branches: [{ name: 'main', hash: 'bbb000000000' }],
  tags: [],
  head: { hash: 'bbb000000000', branch: 'main' },
};

const DIFF = `diff --git a/TARDIS.md b/TARDIS.md
@@ -1 +1 @@
-Pete Tyler: dead
+Pete Tyler: alive
`;

function setup() {
  const show = mock(async (_hash: string) => DIFF);
  const onClose = mock(() => {});
  const view = render(
    <>
      <p>outside</p>
      <CommitPopover graph={graph} hash="bbb000000000" at={{ x: 10, y: 20 }} show={show} onClose={onClose} />
    </>,
  );
  return { show, onClose, ...view };
}

describe('CommitPopover', () => {
  test('shows the commit details and diff', async () => {
    const { show } = setup();
    expect(screen.getByText(/commit bbb000000000/).closest('pre')?.textContent).toContain('(HEAD → main)');
    expect(show).toHaveBeenCalledWith('bbb000000000');
    expect(await screen.findByText('Pete Tyler: alive')).toBeTruthy();
  });

  test('closes on Escape and on a press outside, not inside', () => {
    const { onClose } = setup();
    fireEvent.pointerDown(screen.getByText(/commit bbb000000000/));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText('outside'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
