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
  {
    id: 'episodes',
    episode: 'S01E02',
    title: 'The End of the World',
    story: [{ title: 'Platform One', text: 'The sun expands.', images: [] }],
    steps: [{ episode: { code: 'S01E02', title: 'The End of the World' } }, { cmd: 'git log', caption: 'After' }],
  },
  {
    id: 'journeys-end',
    episode: 'S04E13',
    title: "Journey's End",
    story: [{ title: 'Universes Collide', text: 'Everyone is here.', images: [] }],
    steps: [
      { edit: { 'episodes/rose.md': '# Everyone\n' }, caption: 'Resolve it in the editor' },
      { cmd: 'git log', caption: 'After' },
    ],
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

const playEpisode = mock(async (_code: string) => ({
  cmd: 'git commit -am "The End of the World"',
  ...ran('[prime-timeline b2] The End of the World', graphOf('The End of the World')),
}));

const readFile = mock(async (_path: string) => '# Rose\n');
const writeFile = mock(
  async (path: string, _content: string): Promise<WorkDir> => ({
    files: [{ path, status: 'modified', code: ' M' }],
    merging: false,
  }),
);

const blameFile = mock(async (_path: string) => [
  { hash: 'a1', author: 'Russell T Davies', date: '2005-03-26', summary: 'Episode one', lines: ['# Rose'] },
]);

mock.module('./api', () => ({
  fetchScenes: async () => scenes,
  enterScene,
  runCommand,
  playEpisode,
  readFile,
  writeFile,
  showCommit: async () => '',
  blameFile,
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
  playEpisode.mockClear();
  writeFile.mockClear();
  blameFile.mockClear();
  history.replaceState(null, '', '/');
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

  test('Skip Intro jumps from the intro cards to the git phase', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Skip Intro' }));
    expect(await screen.findByText('Where is the TARDIS?')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip Intro' })).toBeNull();
    expect(location.search).toBe('?scene=rose&card=1');
  });

  test('Skip Intro only shows in the first scene', async () => {
    history.replaceState(null, '', '?scene=dalek&card=0');
    render(<App />);
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Skip Intro' })).toBeNull();
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

  test('a successful git blame opens the file in blame mode in the working directory', async () => {
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git blame episodes/rose.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Russell T Davies · 2005-03-26')).toBeTruthy();
    expect(blameFile).toHaveBeenCalledWith('episodes/rose.md');
  });

  test("the next scene does not reopen the previous scene's blame", async () => {
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git blame episodes/rose.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText('Russell T Davies · 2005-03-26')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await screen.findByLabelText('git command');
    expect(await screen.findByText('episodes/rose.md')).toBeTruthy();
    expect(screen.queryByText('Russell T Davies · 2005-03-26')).toBeNull();
    expect(blameFile).toHaveBeenCalledTimes(1);
  });

  test('a failed git blame leaves the working directory alone', async () => {
    runCommand.mockImplementationOnce(async () => ({ ...ran('fatal: no such path'), code: 128 }));
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git blame nope.md' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/fatal: no such path/)).toBeTruthy();
    expect(blameFile).not.toHaveBeenCalled();
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

  test('returning to a scene does not flash files against the previous scene', async () => {
    const untracked: WorkDir = {
      files: [{ path: 'episodes/rose.md', status: 'untracked', code: '??' }],
      merging: false,
    };
    enterScene.mockImplementation(async (id) => (id === 'dalek' ? { graph, workdir: untracked } : live(graph)));
    await toGitPhase();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    await waitFor(() => expect(enterScene).toHaveBeenCalledWith('dalek'));
    const slow = deferred<LiveState>();
    enterScene.mockImplementationOnce(() => slow.promise);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await screen.findByLabelText('git command');
    await act(async () => slow.resolve(live(graph)));
    const row = (await screen.findByText('episodes/rose.md')).closest('li');
    expect(row?.className).toContain('clean');
    expect(row?.className).not.toContain('flash');
  });

  test('an edit step shows its caption and saving that file moves to the next cue', async () => {
    history.replaceState(null, '', '/?scene=journeys-end&card=1');
    render(<App />);
    expect(await screen.findByText('Resolve it in the editor')).toBeTruthy();
    fireEvent.click(await screen.findByText('episodes/rose.md'));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('edit episodes/rose.md'), { target: { value: '# Everyone\n' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('After')).toBeTruthy();
  });

  test('+ and − zoom only the timeline', async () => {
    await toGitPhase();
    const svg = await screen.findByRole('img', { name: 'timeline' });
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(svg.style.width).toBe('125%');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(svg.style.width).toBe('75%');
  });

  test('starts at the story card in the URL', async () => {
    history.replaceState(null, '', '/?scene=dalek&card=0');
    render(<App />);
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    await waitFor(() => expect(enterScene).toHaveBeenCalledWith('dalek'));
    expect(enterScene).not.toHaveBeenCalledWith('rose');
  });

  test('starts in the git phase when the URL card is past the story', async () => {
    history.replaceState(null, '', '/?scene=rose&card=1');
    render(<App />);
    expect(await screen.findByLabelText('git command')).toBeTruthy();
    expect(screen.getByText('Where is the TARDIS?')).toBeTruthy();
  });

  test('navigating keeps the position in the URL', async () => {
    render(<App />);
    expect(await screen.findByText('The Doctor')).toBeTruthy();
    await waitFor(() => expect(location.search).toBe('?scene=rose&card=0'));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => expect(location.search).toBe('?scene=rose&card=1'));
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => expect(location.search).toBe('?scene=dalek&card=0'));
    expect(history.length).toBe(1);
  });

  test('an unknown scene in the URL falls back to the start', async () => {
    history.replaceState(null, '', '/?scene=nope&card=1');
    render(<App />);
    expect(await screen.findByText('The Doctor')).toBeTruthy();
    await waitFor(() => expect(location.search).toBe('?scene=rose&card=0'));
  });

  test('an episode step shows Next Episode; playing it shows the commit and moves to the next cue', async () => {
    history.replaceState(null, '', '/?scene=episodes&card=1');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /play/i }));
    expect(playEpisode).toHaveBeenCalledWith('S01E02');
    expect(await screen.findByText(/\$ git commit -am "The End of the World"/)).toBeTruthy();
    expect(await screen.findByText('After')).toBeTruthy();
    expect(screen.queryByLabelText('next episode')).toBeNull();
  });

  test('→ plays the next episode instead of leaving the scene', async () => {
    history.replaceState(null, '', '/?scene=episodes&card=1');
    render(<App />);
    await screen.findByRole('button', { name: /play/i });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(playEpisode).toHaveBeenCalledWith('S01E02');
    expect(await screen.findByText('After')).toBeTruthy();
    expect(location.search).toBe('?scene=episodes&card=1');
  });

  test('Next Episode stays hidden while HEAD is detached', async () => {
    enterScene.mockImplementation(async () => live({ ...graph, head: { hash: 'a1', branch: null } }));
    history.replaceState(null, '', '/?scene=episodes&card=1');
    render(<App />);
    await screen.findByLabelText('git command');
    expect(screen.queryByLabelText('next episode')).toBeNull();
  });

  test('a failed episode play can be retried', async () => {
    playEpisode.mockImplementationOnce(async () => {
      throw new Error('500 boom');
    });
    history.replaceState(null, '', '/?scene=episodes&card=1');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /play/i }));
    expect(await screen.findByText(/500 boom/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(await screen.findByText('After')).toBeTruthy();
  });

  test('an episode whose commit fails stays on its step and can be retried', async () => {
    playEpisode.mockImplementationOnce(async () => ({
      cmd: 'git commit -am "The End of the World"',
      ...ran('error: cannot commit', graph),
      code: 1,
    }));
    history.replaceState(null, '', '/?scene=episodes&card=1');
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /play/i }));
    expect(await screen.findByText(/cannot commit/)).toBeTruthy();
    expect(screen.queryByText('After')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(await screen.findByText('After')).toBeTruthy();
  });
});
