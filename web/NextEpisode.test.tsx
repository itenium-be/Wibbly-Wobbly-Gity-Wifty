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

  test('plays on n, unless the console has text in it', () => {
    const onPlay = mock(async () => true);
    render(
      <>
        <input aria-label="console" defaultValue="git" />
        <NextEpisode episode={episode} onPlay={onPlay} />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText('console'), { key: 'n' });
    expect(onPlay).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'n' });
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('plays by itself when the countdown runs out', async () => {
    const onPlay = mock(async () => true);
    render(<NextEpisode episode={episode} onPlay={onPlay} seconds={1} />);
    expect(screen.getByText('1')).toBeTruthy();
    await act(() => new Promise((r) => setTimeout(r, 1100)));
    expect(onPlay).toHaveBeenCalledTimes(1);
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

  test('a new onPlay on re-render does not delay the countdown', async () => {
    const onPlay = mock(async () => true);
    const { rerender } = render(<NextEpisode episode={episode} onPlay={async () => false} seconds={1} />);
    await act(() => new Promise((r) => setTimeout(r, 500)));
    rerender(<NextEpisode episode={episode} onPlay={onPlay} seconds={1} />);
    await act(() => new Promise((r) => setTimeout(r, 600)));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test.each(['ctrlKey', 'metaKey', 'altKey'])('n with %s does not play', (modifier) => {
    const onPlay = mock(async () => true);
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    fireEvent.keyDown(window, { key: 'n', [modifier]: true });
    expect(onPlay).not.toHaveBeenCalled();
  });
});
