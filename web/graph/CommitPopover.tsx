import { useEffect, useRef } from 'react';
import { CommitDiff } from '../workdir/CommitView';

type Props = {
  hash: string;
  at: { x: number; y: number };
  show: (hash: string) => Promise<string>;
  onClose: () => void;
};

export function CommitPopover({ hash, at, show, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={ref}
      className="popover"
      style={{ left: `min(${at.x}px, calc(100vw - var(--popover-width) - 16px))`, top: `min(${at.y}px, 30vh)` }}
    >
      <CommitDiff hash={hash} show={show} />
    </div>
  );
}
