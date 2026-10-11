import { useCallback, useEffect, useRef, useState } from 'react';
import type { Episode } from '../shared/types';

type Props = { episode: Episode; onPlay: () => Promise<boolean>; seconds?: number };

export function NextEpisode({ episode, onPlay, seconds = 8 }: Props) {
  const [left, setLeft] = useState(seconds);
  const played = useRef(false);
  // Held in a ref so a parent re-render (typing in the console) cannot restart the countdown.
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;
  const playOnce = useCallback(() => {
    if (played.current) return;
    played.current = true;
    onPlayRef.current().then(
      (done) => {
        if (!done) played.current = false;
      },
      () => {
        played.current = false;
      },
    );
  }, []);

  useEffect(() => {
    if (left === 0) {
      playOnce();
      return;
    }
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, playOnce]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'n' || e.ctrlKey || e.metaKey || e.altKey || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLInputElement && e.target.value !== '') return;
      e.preventDefault();
      playOnce();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playOnce]);

  return (
    <aside className="next-episode" aria-label="next episode">
      <small className="kicker">NEXT EPISODE</small>
      <div className="code">{episode.code}</div>
      <div className="title">{episode.title}</div>
      <button type="button" onClick={playOnce}>
        ▶ Play <span className="countdown">{left}</span>
      </button>
    </aside>
  );
}
