import { describe, expect, mock, test } from 'bun:test';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { NextEpisode } from './NextEpisode';

const episode = { code: 'S01E02', title: 'The End of the World' };

describe('NextEpisode', () => {
  test('shows the episode and plays on click, once', () => {
    const onPlay = mock(() => {});
    render(<NextEpisode episode={episode} onPlay={onPlay} />);
    expect(screen.getByText('S01E02')).toBeTruthy();
    expect(screen.getByText('The End of the World')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  test('plays on n, unless the console has text in it', () => {
    const onPlay = mock(() => {});
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
    const onPlay = mock(() => {});
    render(<NextEpisode episode={episode} onPlay={onPlay} seconds={1} />);
    expect(screen.getByText('1')).toBeTruthy();
    await act(() => new Promise((r) => setTimeout(r, 1100)));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});
