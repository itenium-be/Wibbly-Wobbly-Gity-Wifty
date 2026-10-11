import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GraphModel, RunResult, SceneView } from '../shared/types';

const graphOf = (message: string): GraphModel => ({
  initialized: true,
  commits: [{ hash: 'a1', short: 'a1', message, parents: [] }],
  branches: [{ name: 'prime-timeline', hash: 'a1' }],
  tags: [],
  head: { hash: 'a1', branch: 'prime-timeline' },
});
const graph = graphOf('Episode one');
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
];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

const enterScene = mock(async (_id: string) => graph);
const runCommand = mock(async (_input: string): Promise<RunResult> => ({ output: 'a1 Episode one', code: 0, graph }));

mock.module('./api', () => ({
  fetchScenes: async () => scenes,
  enterScene,
  runCommand,
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
  enterScene.mockImplementation(async () => graph);
  runCommand.mockReset();
  runCommand.mockImplementation(async () => ({ output: 'a1 Episode one', code: 0, graph }));
});

describe('App', () => {
  test('opens on the first story card, then → reaches the git phase', async () => {
    await toGitPhase();
    expect(await screen.findByText('Episode one')).toBeTruthy();
    expect(screen.getByText('Where is the TARDIS?')).toBeTruthy();
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
    const slow = deferred<GraphModel>();
    enterScene.mockImplementationOnce(() => slow.promise);
    enterScene.mockImplementationOnce(async () => graphOf('Dalek graph'));
    render(<App />);
    expect(await screen.findByText('The Doctor')).toBeTruthy();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByText('The Last Dalek')).toBeTruthy();
    await waitFor(() => expect(enterScene).toHaveBeenCalledTimes(2));
    await act(async () => slow.resolve(graphOf('Rose graph')));
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
    await act(async () => slow.resolve({ output: 'STALE OUTPUT', code: 0, graph: graphOf('Stale graph') }));
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
    await act(async () => slow.resolve({ output: 'done', code: 0, graph }));
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
});
