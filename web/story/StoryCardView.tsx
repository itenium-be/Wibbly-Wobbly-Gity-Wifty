import { useEffect, useState } from 'react';
import type { StoryCard } from '../../shared/types';

export function StoryCardView({
  card,
  image = 0,
  intervalMs = 3000,
}: {
  card: StoryCard;
  image?: number;
  intervalMs?: number;
}) {
  const [rotated, setRotated] = useState(0);
  const count = card.images.length;
  const index = card.reveal ? image : rotated;

  useEffect(() => {
    if (card.reveal || count < 2) return;
    const id = setInterval(() => setRotated((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [card.reveal, count, intervalMs]);

  const shown = card.images[index];
  return (
    <section className="story">
      <figure>
        <div className="frame">
          {card.images.map((img, i) => (
            <img key={img.src} src={img.src} alt={img.name ?? card.title} className={i === index ? 'shown' : ''} />
          ))}
        </div>
        <figcaption>
          {shown?.name && <div className="name">{shown.name}</div>}
          {shown?.quote && <div className="quote">{shown.quote}</div>}
          {shown?.stamp && <div className="stamp">{shown.stamp}</div>}
          {shown?.fate && <div className="fate">{shown.fate}</div>}
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
