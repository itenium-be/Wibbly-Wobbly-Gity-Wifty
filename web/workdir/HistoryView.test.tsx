import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
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

function setup() {
  const onDone = mock(() => {});
  const view = render(<HistoryView graph={graph} onDone={onDone} />);
  return { onDone, ...view };
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
});
