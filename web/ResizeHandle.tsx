import { type PointerEvent, useRef } from 'react';

type Props = {
  /** The edge being dragged: the panel sits against the opposite edge of the page, so its size is the pointer's distance from that edge. */
  edge: 'left' | 'top';
  variable: string;
  min: number;
};

export function ResizeHandle({ edge, variable, min }: Props) {
  const dragging = useRef(false);

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const total = edge === 'left' ? innerWidth : innerHeight;
    const size = Math.min(Math.max(total - (edge === 'left' ? e.clientX : e.clientY), min), total - min);
    document.documentElement.style.setProperty(variable, `${size}px`);
  };

  return (
    <div
      className={`resize ${edge}`}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={() => {
        dragging.current = false;
      }}
    />
  );
}
