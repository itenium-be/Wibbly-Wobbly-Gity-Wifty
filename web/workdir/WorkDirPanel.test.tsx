import { describe, expect, mock, test } from 'bun:test';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GraphModel, WorkDir } from '../../shared/types';
import { WorkDirPanel } from './WorkDirPanel';

const workdir: WorkDir = {
  merging: false,
  files: [
    { path: 'clean.md', status: 'clean', code: '' },
    { path: 'TARDIS.md', status: 'conflicted', code: 'UU' },
    { path: 'new.md', status: 'untracked', code: '??' },
  ],
};

const graph: GraphModel = {
  initialized: true,
  commits: [{ hash: 'a1b2c3d4', short: 'a1b2c3d', message: 'Rose', parents: [] }],
  branches: [{ name: 'prime-timeline', hash: 'a1b2c3d4' }],
  tags: [],
  head: { hash: 'a1b2c3d4', branch: 'prime-timeline' },
};

const CONFLICT = `# TARDIS
<<<<<<< HEAD
The Doctor
=======
Pete
>>>>>>> petes-world
`;

function setup(content = CONFLICT) {
  const load = mock(async (_path: string) => content);
  const save = mock(async (_path: string, _content: string) => {});
  const onDone = mock(() => {});
  const props = { branch: 'prime-timeline', graph, load, save, onDone };
  const view = render(<WorkDirPanel workdir={workdir} {...props} />);
  return { load, save, onDone, props, ...view };
}

const open = async (path: string) => {
  fireEvent.click(screen.getByText(path));
  return screen.findByText(`${path} — ${workdir.files.find((f) => f.path === path)?.status}`);
};

const row = (path: string) => screen.getByText(path).closest('li') as HTMLLIElement;

describe('WorkDirPanel', () => {
  test('lists every file with its status code, name and status', () => {
    setup();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'clean.mdclean',
      'UUTARDIS.mdconflicted',
      '??new.mduntracked',
    ]);
    expect(row('TARDIS.md').className).toContain('conflicted');
    expect(row('new.md').className).toContain('untracked');
  });

  test('shows the branch, flagged red while merging', () => {
    const { rerender, container, props } = setup();
    expect(container.querySelector('.branch')?.textContent).toBe('prime-timeline');
    expect(container.querySelector('.branch.merging')).toBeNull();
    rerender(<WorkDirPanel workdir={{ ...workdir, merging: true }} {...props} />);
    expect(container.querySelector('.branch.merging')?.textContent).toBe('prime-timeline|MERGING');
  });

  test('switches between the working directory and the history', () => {
    setup();
    const tab = (name: RegExp) => screen.getByRole('tab', { name });
    expect(tab(/WORKING DIR/).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(tab(/HISTORY/));
    expect(tab(/HISTORY/).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByText('TARDIS.md')).toBeNull();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['a1b2c3dHEAD → prime-timelineRose']);
    fireEvent.click(tab(/WORKING DIR/));
    expect(screen.getByText('TARDIS.md')).toBeTruthy();
  });

  test('counts the changed files on the working directory tab', () => {
    const { rerender, props } = setup();
    expect(screen.getByRole('tab', { name: /WORKING DIR/ }).textContent).toBe('WORKING DIR2');
    rerender(<WorkDirPanel workdir={{ ...workdir, files: [workdir.files[0]] }} {...props} />);
    expect(screen.getByRole('tab', { name: /WORKING DIR/ }).textContent).toBe('WORKING DIR');
  });

  test('flashes a file whose status changed', () => {
    const { rerender, props } = setup();
    expect(row('new.md').className).not.toContain('flash');
    const staged: WorkDir = {
      ...workdir,
      files: workdir.files.map((f) => (f.path === 'new.md' ? { ...f, status: 'staged', code: 'A ' } : f)),
    };
    rerender(<WorkDirPanel workdir={staged} {...props} />);
    expect(row('new.md').className).toContain('flash');
    expect(row('clean.md').className).not.toContain('flash');
    fireEvent.animationEnd(row('new.md'));
    expect(row('new.md').className).not.toContain('flash');
  });

  test('clicking a file shows its content', async () => {
    const { load } = setup('# Clean\n');
    await open('clean.md');
    expect(load).toHaveBeenCalledWith('clean.md');
    expect(screen.getByText('# Clean')).toBeTruthy();
    expect(row('clean.md').className).toContain('open');
  });

  test('highlights conflict markers and tints ours and theirs', async () => {
    const { container } = setup();
    await open('TARDIS.md');
    const lines = [...container.querySelectorAll('.viewer pre span')].map((s) => [s.className, s.textContent]);
    expect(lines).toEqual([
      ['', '# TARDIS'],
      ['marker', '<<<<<<< HEAD'],
      ['ours', 'The Doctor'],
      ['marker', '======='],
      ['theirs', 'Pete'],
      ['marker', '>>>>>>> petes-world'],
    ]);
  });

  test('does not mistake a setext heading underline for a conflict marker', async () => {
    const { container } = setup('Bad Wolf\n=======\n\nRose\n========\n');
    await open('clean.md');
    expect(container.querySelectorAll('.viewer pre .marker')).toHaveLength(0);
  });

  test('reloads the open file when the working directory changes', async () => {
    const { load, rerender, props } = setup();
    await open('TARDIS.md');
    load.mockImplementation(async () => '# TARDIS\nThe Doctor and Pete\n');
    rerender(<WorkDirPanel workdir={{ ...workdir }} {...props} />);
    expect(await screen.findByText('The Doctor and Pete')).toBeTruthy();
  });

  test('Edit then Save writes the edited content', async () => {
    const { save, onDone } = setup('# Clean\n');
    await open('clean.md');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    onDone.mockClear();
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('# Clean\n');
    await waitFor(() => expect(document.activeElement === textarea).toBe(true));
    fireEvent.change(textarea, { target: { value: '# Edited\n' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })));
    expect(save).toHaveBeenCalledWith('clean.md', '# Edited\n');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('Esc in the editor cancels without saving', async () => {
    const { save, onDone } = setup('# Clean\n');
    await open('clean.md');
    expect(onDone).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'discarded' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('# Clean')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  test('a failed save keeps the editor open and shows the error', async () => {
    const { save } = setup('# Clean\n');
    save.mockImplementation(async () => {
      throw new Error('500 boom');
    });
    await open('clean.md');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save' })));
    expect(screen.getByRole('textbox')).toBeTruthy();
    expect(screen.getByText('500 boom')).toBeTruthy();
  });
});
