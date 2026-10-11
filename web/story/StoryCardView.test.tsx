import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { StoryCard } from '../../shared/types';
import { StoryCardView } from './StoryCardView';

const companions: StoryCard = {
  title: 'The Companions',
  text: 'They travel with him.',
  images: [
    { src: '/clara.jpg', name: 'Clara Oswald', stamp: 'DIED', fate: 'Faced the raven' },
    { src: '/donna.jpg', name: 'Donna Noble', stamp: 'MEMORY WIPED', fate: 'Her mind would burn' },
  ],
};

describe('StoryCardView', () => {
  test('shows title, text and the first image captions', () => {
    render(<StoryCardView card={companions} />);
    expect(screen.getByText('The Companions')).toBeTruthy();
    expect(screen.getByText('They travel with him.')).toBeTruthy();
    expect(screen.getByText('Clara Oswald')).toBeTruthy();
    expect(screen.getByText('DIED')).toBeTruthy();
    expect(screen.getByText('Faced the raven')).toBeTruthy();
  });

  test('rotates to the next image and its captions', async () => {
    render(<StoryCardView card={companions} intervalMs={20} />);
    expect(await screen.findByText('Donna Noble', {}, { timeout: 500 })).toBeTruthy();
    expect(screen.getByText('MEMORY WIPED')).toBeTruthy();
  });

  test('shows the quote of the image', () => {
    render(
      <StoryCardView
        card={{ title: 'The Doctor', text: 'A Time Lord.', images: [{ src: '/11.jpg', quote: 'Bow ties are cool.' }] }}
      />,
    );
    expect(screen.getByText('Bow ties are cool.')).toBeTruthy();
  });

  test('a reveal card shows the given image and does not rotate', async () => {
    const tardis: StoryCard = {
      title: 'The TARDIS',
      text: 'Bigger on the inside.',
      reveal: true,
      images: [
        { src: '/outside.jpg', name: 'Outside' },
        { src: '/inside.jpg', name: 'Inside' },
      ],
    };
    const { rerender } = render(<StoryCardView card={tardis} image={0} intervalMs={20} />);
    await new Promise((r) => setTimeout(r, 60));
    expect(screen.getByText('Outside')).toBeTruthy();
    rerender(<StoryCardView card={tardis} image={1} intervalMs={20} />);
    expect(screen.getByText('Inside')).toBeTruthy();
  });

  test('a single image shows no position dots', () => {
    const { container } = render(
      <StoryCardView card={{ title: 'The TARDIS', text: 'His time machine.', images: [{ src: '/tardis.jpg' }] }} />,
    );
    expect(container.querySelector('.dots')).toBeNull();
  });
});
