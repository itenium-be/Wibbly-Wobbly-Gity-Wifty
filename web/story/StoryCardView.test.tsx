import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { StoryCard } from '../../shared/types';
import { StoryCardView } from './StoryCardView';

const companions: StoryCard = {
  title: 'The Companions',
  text: 'They travel with him.',
  images: [
    { src: '/rose.jpg', name: 'Rose Tyler', fate: 'TRAPPED IN A PARALLEL UNIVERSE' },
    { src: '/donna.jpg', name: 'Donna Noble', fate: 'MEMORY WIPED' },
  ],
};

describe('StoryCardView', () => {
  test('shows title, text and the first image captions', () => {
    render(<StoryCardView card={companions} />);
    expect(screen.getByText('The Companions')).toBeTruthy();
    expect(screen.getByText('They travel with him.')).toBeTruthy();
    expect(screen.getByText('Rose Tyler')).toBeTruthy();
    expect(screen.getByText('TRAPPED IN A PARALLEL UNIVERSE')).toBeTruthy();
  });

  test('rotates to the next image and its captions', async () => {
    render(<StoryCardView card={companions} intervalMs={20} />);
    expect(await screen.findByText('Donna Noble', {}, { timeout: 500 })).toBeTruthy();
    expect(screen.getByText('MEMORY WIPED')).toBeTruthy();
  });

  test('a single image shows no position dots', () => {
    const { container } = render(
      <StoryCardView card={{ title: 'The TARDIS', text: 'His time machine.', images: [{ src: '/tardis.jpg' }] }} />,
    );
    expect(container.querySelector('.dots')).toBeNull();
  });
});
