import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommitPopover } from './CommitPopover';

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
      <CommitPopover hash="bbb000000000" at={{ x: 10, y: 20 }} show={show} onClose={onClose} />
    </>,
  );
  return { show, onClose, ...view };
}

describe('CommitPopover', () => {
  test('shows only the diff, not the commit details', async () => {
    const { show, container } = setup();
    expect(show).toHaveBeenCalledWith('bbb000000000');
    expect(await screen.findByText('Pete Tyler: alive')).toBeTruthy();
    expect(container.querySelector('pre')).toBeNull();
  });

  test('closes on Escape and on a press outside, not inside', async () => {
    const { onClose } = setup();
    fireEvent.pointerDown(await screen.findByText('Pete Tyler: alive'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(screen.getByText('outside'));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
