import { type CSSProperties, useEffect, useState } from 'react';
import type { StoryCard } from '../../shared/types';

export function StoryCardView({
  card,
  step = 0,
  intervalMs = 3000,
}: {
  card: StoryCard;
  step?: number;
  intervalMs?: number;
}) {
  const [rotated, setRotated] = useState(0);
  const [stampedAt, setStampedAt] = useState(-1);
  const count = card.images.length;
  const imageSteps = card.reveal ? count : 1;
  const index = card.reveal ? Math.min(step, count - 1) : rotated;
  const revealedGroups = Math.max(step - imageSteps + 1, 0) + 1;

  useEffect(() => {
    if (card.reveal || count < 2) return;
    const id = setInterval(() => setRotated((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [card.reveal, count, intervalMs]);

  useEffect(() => {
    const id = setTimeout(() => setStampedAt(index), intervalMs / 2);
    return () => clearTimeout(id);
  }, [index, intervalMs]);

  const shown = card.images[index];
  return (
    <section className="story">
      <figure>
        <div className="frame">
          {card.images.map((img, i) => (
            <img key={img.src} src={img.src} alt={img.name ?? card.title} className={i === index ? 'shown' : ''} />
          ))}
          {stampedAt === index && shown?.stamp && (
            <div className="stamp" style={{ '--longest-word': longestWord(shown.stamp) } as CSSProperties}>
              {shown.stamp}
              {shown.stampNote && <small>{shown.stampNote}</small>}
            </div>
          )}
        </div>
        <figcaption>
          {shown?.name && <div className="name">{shown.name}</div>}
          {shown?.quote && <div className="quote">{shown.quote}</div>}
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
        {card.text && <p>{card.text}</p>}
        {card.boxes?.map((group, i) => (
          <div
            key={group.boxes.join('|')}
            className={i < revealedGroups ? 'box-group' : 'box-group pending'}
            aria-hidden={i >= revealedGroups}
          >
            {group.title && <h3 className="boxes-title">{group.title}</h3>}
            <div className="boxes">
              {group.boxes.map((box) => (
                <div key={box} className="box">
                  {box}
                </div>
              ))}
            </div>
          </div>
        ))}
        {card.qr && (
          <a className="qr" href={card.qr.url}>
            <img src={card.qr.src} alt={`QR code to ${bare(card.qr.url)}`} />
            {bare(card.qr.url)}
          </a>
        )}
      </div>
    </section>
  );
}

function bare(url: string) {
  return url.replace(/^https?:\/\//, '');
}

function longestWord(text: string) {
  return Math.max(...text.split(' ').map((w) => w.length));
}
