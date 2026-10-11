import { useEffect, useState } from 'react';
import type { StoryCard } from '../../shared/types';

export function StoryCardView({ card, intervalMs = 3000 }: { card: StoryCard; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const count = card.images.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  const image = card.images[index];
  return (
    <section className="story">
      <figure>
        <div className="frame">
          {card.images.map((img, i) => (
            <img key={img.src} src={img.src} alt={img.name ?? card.title} className={i === index ? 'shown' : ''} />
          ))}
        </div>
        <figcaption>
          {image?.name && <div className="name">{image.name}</div>}
          {image?.fate && <div className="fate">{image.fate}</div>}
          {count > 1 && (
            <div className="dots">
              {card.images.map((img, i) => (
                <span key={img.src} className={i === index ? 'on' : ''} />
              ))}
            </div>
          )}
        </figcaption>
      </figure>
      <div className="story-text">
        <h2>{card.title}</h2>
        <p>{card.text}</p>
      </div>
    </section>
  );
}
