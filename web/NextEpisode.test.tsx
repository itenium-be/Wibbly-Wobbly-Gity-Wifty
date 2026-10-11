import { describe, expect, mock, test } from 'bun:test';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextEpisode } from './NextEpisode';

const episode = { code: 'S01E02', title: 'The End of the World' };

describe('NextEpisode', () => {
  test('shows the episode and plays on click, once', () => {
    const onPlay = mock(async () => true);
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    expect(screen.getByText('S01E02')).toBeTruthy();
    expect(screen.getByText('The End of the World')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('a fast forward says so instead of Next Episode', () => {
    render(<NextEpisode episode={{ ...episode, fastForward: true }} onPlay={async () => true} />);
    expect(screen.getByText('FAST FORWARD')).toBeTruthy();
    expect(screen.queryByText('NEXT EPISODE')).toBeNull();
  });

  test('plays on →, unless the console has text in it', () => {
    const onPlay = mock(async () => true);
    render(
      <>
        <input aria-label="console" defaultValue="git" />
        <NextEpisode episode={episode} onPlay={onPlay} />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText('console'), { key: 'ArrowRight' });
    expect(onPlay).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('waits for the presenter instead of playing by itself', async () => {
    const onPlay = mock(async () => true);
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(onPlay).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '▶ Play' })).toBeTruthy();
  });

  test('a play that was dropped can be retried', async () => {
    const onPlay = mock(async () => false);
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /play/i })));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /play/i })));
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  test('a play that rejects can be retried', async () => {
    const onPlay = mock(async () => {
      throw new Error('boom');
    });
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /play/i })));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: /play/i })));
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  test.each(['ctrlKey', 'metaKey', 'altKey'])('→ with %s does not play', (modifier) => {
    const onPlay = mock(async () => true);
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    fireEvent.keyDown(window, { key: 'ArrowRight', [modifier]: true });
    expect(onPlay).not.toHaveBeenCalled();
  });
});
