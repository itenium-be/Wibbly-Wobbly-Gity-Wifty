import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Commit, GraphModel } from '../../shared/types';
import { HistoryView } from './HistoryView';

const c = (hash: string, message: string, ...parents: string[]): Commit => ({
  hash: `${hash}000000000`,
  short: hash,
  message,
  parents: parents.map((p) => `${p}000000000`),
});

const graph: GraphModel = {
  initialized: true,
  commits: [c('aaa', 'Add TARDIS.md'), c('bbb', 'Pete lives', 'aaa'), c('ccc', 'Reapers appear', 'aaa')],
  branches: [
    { name: 'main', hash: 'bbb000000000' },
    { name: 'reaper', hash: 'ccc000000000' },
  ],
  tags: [],
  head: { hash: 'bbb000000000', branch: 'main' },
};

const DIFF = `diff --git a/TARDIS.md b/TARDIS.md
--- a/TARDIS.md
+++ b/TARDIS.md
@@ -1,2 +1,2 @@
 # TARDIS log
-Pete Tyler: dead
+Pete Tyler: alive
`;

function setup(show = mock(async (_hash: string) => DIFF)) {
  const onDone = mock(() => {});
  const view = render(<HistoryView graph={graph} show={show} onDone={onDone} />);
  return { onDone, show, ...view };
}

const rows = () => screen.getAllByRole('listitem').map((li) => li.textContent);

describe('HistoryView', () => {
  test('lists commits newest first as hash, refs and message', () => {
    setup();
    expect(rows()).toEqual(['cccreaperReapers appear', 'bbbHEAD → mainPete lives', 'aaaAdd TARDIS.md']);
  });

  test('draws a dot per commit and a line per parent', () => {
    const { container } = setup();
    expect(container.querySelectorAll('.log svg circle')).toHaveLength(3);
    expect(container.querySelectorAll('.log svg path')).toHaveLength(2);
    expect(container.querySelector('.log svg circle.head')).not.toBeNull();
  });

  test('HEAD scope hides commits HEAD cannot reach', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'HEAD' }));
    expect(rows()).toEqual(['bbbHEAD → mainPete lives', 'aaaAdd TARDIS.md']);
    expect(screen.getByRole('button', { name: 'HEAD' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '--all' }));
    expect(rows()).toHaveLength(3);
  });

  test('clicking a commit shows its details', () => {
    const { onDone } = setup();
    fireEvent.click(screen.getByText('Pete lives'));
    expect(screen.getByText('bbb — Pete lives')).toBeTruthy();
    expect(screen.getByText(/commit bbb000000000/)).toBeTruthy();
    expect(screen.getByText('Pete lives').closest('li')?.className).toContain('open');
    expect(onDone).toHaveBeenCalled();
  });

  test('clicking a commit shows its diff below the details', async () => {
    const { show, container } = setup();
    fireEvent.click(screen.getByText('Pete lives'));
    expect(show).toHaveBeenCalledWith('bbb000000000');
    expect(await screen.findByText('Pete Tyler: alive')).toBeTruthy();
    expect(container.querySelector('.diff .file')?.textContent).toBe('TARDIS.md+1 −1');
    expect([...container.querySelectorAll('.diff .ln')].map((l) => [l.className, l.textContent])).toEqual([
      ['ln ctx', ' # TARDIS log'],
      ['ln del', '-Pete Tyler: dead'],
      ['ln add', '+Pete Tyler: alive'],
    ]);
  });

  test('a failed diff shows the error', async () => {
    setup(
      mock(async () => {
        throw new Error('404 unknown commit');
      }),
    );
    fireEvent.click(screen.getByText('Pete lives'));
    await waitFor(() => expect(screen.getByText('404 unknown commit')).toBeTruthy());
  });
});
