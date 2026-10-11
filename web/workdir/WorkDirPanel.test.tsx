import { describe, expect, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { WorkDir } from '../../shared/types';
import { WorkDirPanel } from './WorkDirPanel';

const workdir: WorkDir = {
  merging: false,
  files: [
    { path: 'clean.md', status: 'clean', code: '' },
    { path: 'TARDIS.md', status: 'conflicted', code: 'UU' },
    { path: 'new.md', status: 'untracked', code: '??' },
  ],
};

const row = (path: string) => screen.getByText(path).closest('li') as HTMLLIElement;

describe('WorkDirPanel', () => {
  test('lists every file with its status code, name and status', () => {
    render(<WorkDirPanel workdir={workdir} branch="prime-timeline" />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'clean.mdclean',
      'UUTARDIS.mdconflicted',
      '??new.mduntracked',
    ]);
    expect(row('TARDIS.md').className).toContain('conflicted');
    expect(row('new.md').className).toContain('untracked');
  });

  test('shows the branch, flagged red while merging', () => {
    const { rerender, container } = render(<WorkDirPanel workdir={workdir} branch="prime-timeline" />);
    expect(container.querySelector('.branch')?.textContent).toBe('prime-timeline');
    expect(container.querySelector('.branch.merging')).toBeNull();
    rerender(<WorkDirPanel workdir={{ ...workdir, merging: true }} branch="prime-timeline" />);
    expect(container.querySelector('.branch.merging')?.textContent).toBe('prime-timeline|MERGING');
  });

  test('flashes a file whose status changed', () => {
    const { rerender } = render(<WorkDirPanel workdir={workdir} branch="prime-timeline" />);
    expect(row('new.md').className).not.toContain('flash');
    const staged: WorkDir = {
      ...workdir,
      files: workdir.files.map((f) => (f.path === 'new.md' ? { ...f, status: 'staged', code: 'A ' } : f)),
    };
    rerender(<WorkDirPanel workdir={staged} branch="prime-timeline" />);
    expect(row('new.md').className).toContain('flash');
    expect(row('clean.md').className).not.toContain('flash');
    fireEvent.animationEnd(row('new.md'));
    expect(row('new.md').className).not.toContain('flash');
  });
});
