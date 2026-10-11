import { useEffect, useRef } from 'react';
import type { GraphModel } from '../../shared/types';
import { CommitView } from '../workdir/CommitView';
import { labels } from '../workdir/history';

type Props = {
  graph: GraphModel;
  hash: string;
  at: { x: number; y: number };
  show: (hash: string) => Promise<string>;
  onClose: () => void;
};

export function CommitPopover({ graph, hash, at, show, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const commit = graph.commits.find((c) => c.hash === hash);

  useEffect(() => {
    const press = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('pointerdown', press);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('keydown', key);
    };
  }, [onClose]);

  if (!commit) return null;
  return (
    <div
      ref={ref}
      className="popover"
      style={{ left: `min(${at.x}px, calc(100vw - var(--popover-width) - 16px))`, top: `min(${at.y}px, 30vh)` }}
    >
      <CommitView commit={commit} refs={labels(graph, hash)} show={show} />
    </div>
  );
}
