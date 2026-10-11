import { useCallback, useEffect, useRef } from 'react';
import type { Episode } from '../shared/types';

type Props = { episode: Episode; onPlay: () => Promise<boolean> };

export function NextEpisode({ episode, onPlay }: Props) {
  const played = useRef(false);
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
      <small className="kicker">{episode.fastForward ? 'FAST FORWARD' : 'NEXT EPISODE'}</small>
      <div className="code">{episode.code}</div>
      <div className="title">{episode.title}</div>
      <button type="button" onClick={playOnce}>
        ▶ Play
      </button>
    </aside>
  );
}
