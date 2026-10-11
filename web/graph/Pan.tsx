import { type PointerEvent, type ReactNode, useRef } from 'react';

export function Pan({ children }: { children: ReactNode }) {
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const down = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 2) return;
    const el = e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    e.currentTarget.scrollLeft = d.left - (e.clientX - d.x);
    e.currentTarget.scrollTop = d.top - (e.clientY - d.y);
  };

  return (
    <main
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={() => {
        drag.current = null;
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </main>
  );
}
