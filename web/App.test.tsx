import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GraphModel, LiveState, RunResult, SceneView, WorkDir } from '../shared/types';

const graphOf = (message: string): GraphModel => ({
  initialized: true,
  commits: [{ hash: 'a1', short: 'a1', message, parents: [] }],
  branches: [{ name: 'prime-timeline', hash: 'a1' }],
  tags: [],
  head: { hash: 'a1', branch: 'prime-timeline' },
});
const graph = graphOf('Episode one');
const workdir: WorkDir = { files: [{ path: 'episodes/rose.md', status: 'clean', code: '' }], merging: false };
const live = (g: GraphModel): LiveState => ({ graph: g, workdir });
const scenes: SceneView[] = [
  {
    id: 'rose',
    episode: 'S01E01',
    title: 'Rose',
    story: [{ title: 'The Doctor', text: 'This is the Doctor.', images: [] }],
    steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }],
  },
  {
    id: 'dalek',
    episode: 'S01E06',
    title: 'Dalek',
    story: [{ title: 'The Last Dalek', text: 'It survived.', images: [] }],
    steps: [],
  },
  {
    id: 'tardis',
    episode: 'S01E13',
    title: 'The Parting of the Ways',
    story: [
      {
        title: 'The TARDIS',
        text: 'Bigger on the inside.',
        reveal: true,
        images: [
          { src: '/outside.jpg', name: 'Outside' },
          { src: '/inside.jpg', name: 'Inside' },
        ],
      },
    ],
    steps: [],
  },
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const enterScene = mock(async (_id: string) => live(graph));
const ran = (output: string, g = graph): RunResult => ({ output, code: 0, ...live(g) });
const runCommand = mock(async (_input: string) => ran('a1 Episode one'));

const readFile = mock(async (_path: string) => '# Rose\n');
const writeFile = mock(
  async (path: string, _content: string): Promise<WorkDir> => ({
    files: [{ path, status: 'modified', code: ' M' }],
    merging: false,
  }),
);

mock.module('./api', () => ({
  fetchScenes: async () => scenes,
  enterScene,
  runCommand,
  readFile,
  writeFile,
}));
const { App } = await import('./App');

async function toGitPhase() {
  render(<App />);
  expect(await screen.findByText('The Doctor')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  return screen.findByLabelText('git command');
}

beforeEach(() => {
  enterScene.mockReset();
  enterScene.mockImplementation(async () => live(graph));
  runCommand.mockReset();
  runCommand.mockImplementation(async () => ran('a1 Episode one'));
  writeFile.mockClear();
});

async function editRose() {
  await toGitPhase();
  fireEvent.click(await screen.findByText('episodes/rose.md'));
  fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
  return screen.getByLabelText('edit episodes/rose.md') as HTMLTextAreaElement;
}

describe('App', () => {
  test('→ on a reveal card shows its next image before leaving the card', async () => {
    render(<App />);
    expect(await screen.findByText('The Doctor')).toBeTruthy();
    for (let i = 0; i < 4; i++) fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('Outside')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('Inside')).toBeTruthy();
    expect(screen.getByText('The TARDIS')).toBeTruthy();
  });

  test('opens on the first story card, then → reaches the git phase', async () => {
    await toGitPhase();
    expect(await screen.findByText('Episode one')).toBeTruthy();
    expect(screen.getByText('Where is the TARDIS?')).toBeTruthy();
  });

  test('shows the working directory and updates it after a run', async () => {
    runCommand.mockImplementationOnce(async () => ({
      ...ran('rm episodes/rose.md'),
      workdir: { files: [{ path: 'episodes/rose.md', status: 'untracked', code: '??' }], merging: false },
    }));
    const input = await toGitPhase();
    const row = () => screen.getByText('episodes/rose.md').closest('li');
    expect((await screen.findByText('episodes/rose.md')).closest('li')?.className).toContain('clean');
    expect(screen.getByText('prime-timeline', { selector: '.branch' })).toBeTruthy();
    fireEvent.change(input, { target: { value: 'git rm --cached episodes/rose.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(row()?.className).toContain('untracked'));
  });

  test('a detached HEAD shows as such in the working directory header', async () => {
    enterScene.mockImplementation(async () => live({ ...graph, head: { hash: 'a1', branch: null } }));
    await toGitPhase();
    expect(await screen.findByText('HEAD (detached)', { selector: '.branch' })).toBeTruthy();
  });

  test('running the cued command shows its output and advances the cue', async () => {
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git log' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/a1 Episode one/)).toBeTruthy();
    expect(runCommand).toHaveBeenCalledWith('git log');
    expect(screen.queryByText('Where is the TARDIS?')).toBeNull();
  });

  test('a slow enterScene response for a scene we left does not overwrite the graph', async () => {
    const slow = deferred<LiveState>();
    enterScene.mockImplementationOnce(() => slow.promise);
    enterScene.mockImplementationOnce(async () => live(graphOf('Dalek graph')));
    render(<App />);
    expect(await screen.findByText('The Doctor')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    await waitFor(() => expect(enterScene).toHaveBeenCalledTimes(2));
    await act(async () => slow.resolve(live(graphOf('Rose graph'))));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByLabelText('git command')).toBeTruthy();
    expect(await screen.findByText('Dalek graph')).toBeTruthy();
    expect(screen.queryByText('Rose graph')).toBeNull();
  });

  test('a run result arriving after the scene changed is ignored', async () => {
    const slow = deferred<RunResult>();
    runCommand.mockImplementationOnce(() => slow.promise);
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git log' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    await act(async () => slow.resolve(ran('STALE OUTPUT', graphOf('Stale graph'))));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await screen.findByLabelText('git command');
    expect(screen.queryByText(/STALE OUTPUT/)).toBeNull();
    expect(screen.queryByText('Stale graph')).toBeNull();
  });

  test('Enter while a run is in flight does not run the command again', async () => {
    const slow = deferred<RunResult>();
    runCommand.mockImplementationOnce(() => slow.promise);
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git log' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => slow.resolve(ran('done')));
    expect(runCommand).toHaveBeenCalledTimes(1);
  });

  test('Esc then r resets and returns focus to the input', async () => {
    const input = await toGitPhase();
    await waitFor(() => expect(document.activeElement === input).toBe(true));
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.activeElement === input).toBe(false);
    fireEvent.keyDown(window, { key: 'r' });
    await waitFor(() => expect(document.activeElement === input).toBe(true));
  });

  test('a failed run shows the error in the output pane and allows retrying', async () => {
    runCommand.mockImplementationOnce(async () => {
      throw new Error('500 boom');
    });
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git log' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/500 boom/)).toBeTruthy();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/a1 Episode one/)).toBeTruthy();
  });

  test('saving an edited file writes it and refreshes the working directory', async () => {
    const editor = await editRose();
    fireEvent.change(editor, { target: { value: '# Bad Wolf\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('episodes/rose.md').closest('li')?.className).toContain('modified'));
    expect(writeFile).toHaveBeenCalledWith('episodes/rose.md', '# Bad Wolf\n');
  });

  test('arrow keys and r do nothing while typing in the editor', async () => {
    const editor = await editRose();
    fireEvent.keyDown(editor, { key: 'ArrowRight' });
    fireEvent.keyDown(editor, { key: 'ArrowLeft' });
    fireEvent.keyDown(editor, { key: 'r' });
    expect(screen.getByLabelText('edit episodes/rose.md')).toBeTruthy();
    expect(enterScene).toHaveBeenCalledTimes(1);
  });

  test('after opening, saving or cancelling a file, focus is back on the console input', async () => {
    const input = await toGitPhase();
    const typeR = () => fireEvent.keyDown(document.activeElement ?? window, { key: 'r' });
    fireEvent.click(await screen.findByText('episodes/rose.md'));
    await waitFor(() => expect(document.activeElement === input).toBe(true));
    typeR();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.keyDown(screen.getByLabelText('edit episodes/rose.md'), { key: 'Escape' });
    await waitFor(() => expect(document.activeElement === input).toBe(true));
    typeR();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(document.activeElement === input).toBe(true));
    typeR();

    expect(enterScene).toHaveBeenCalledTimes(1);
  });
});
