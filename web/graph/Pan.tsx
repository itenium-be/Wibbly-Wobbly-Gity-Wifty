import { type PointerEvent, type ReactNode, useRef, useState } from 'react';

// A translate rather than scrolling, so the view also moves when the content fits and there is nothing to scroll.
export function Pan({ children }: { children: ReactNode }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const down = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 2) return;
    drag.current = { x: e.clientX, y: e.clientY, left: offset.x, top: offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const move = (e: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.left + e.clientX - d.x, y: d.top + e.clientY - d.y });
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
      <div className="pan" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        {children}
      </div>
    </main>
  );
}
