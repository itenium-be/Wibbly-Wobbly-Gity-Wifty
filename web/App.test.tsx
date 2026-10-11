import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GraphModel, SceneView } from '../shared/types';

const graph: GraphModel = {
  initialized: true,
  commits: [{ hash: 'a1', short: 'a1', message: 'Episode one', parents: [] }],
  branches: [{ name: 'prime-timeline', hash: 'a1' }],
  tags: [],
  head: { hash: 'a1', branch: 'prime-timeline' },
};
const scenes: SceneView[] = [
  {
    id: 'rose',
    episode: 'S01E01',
    title: 'Rose',
    story: [{ title: 'The Doctor', text: 'This is the Doctor.', images: [] }],
    steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }],
  },
];
const runCommand = mock(async () => ({ output: 'a1 Episode one', code: 0, graph }));

mock.module('./api', () => ({
  fetchScenes: async () => scenes,
  enterScene: async () => graph,
  runCommand,
}));
const { App } = await import('./App');

async function toGitPhase() {
  render(<App />);
  expect(await screen.findByText('The Doctor')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  return screen.findByLabelText('git command');
}

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
});
