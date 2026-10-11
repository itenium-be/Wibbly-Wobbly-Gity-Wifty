import { useEffect, useRef } from 'react';
import { twirl } from './twirl';

const WINDOWS = [-16, 2].flatMap((wx) => [-36, -22, -8].map((wy) => [wx, wy] as const));
// Middle of the drawn box relative to its feet, so it spins and wobbles about its centre.
const CENTRE_Y = -38;

const parked = (x: number, y: number) => `translate(${x}px, ${y}px)`;

export function Tardis({ x, y, durationMs = 2200 }: { x: number; y: number; durationMs?: number }) {
  const ref = useRef<SVGGElement>(null);
  const drawn = useRef({ x, y });

  useEffect(() => {
    const el = ref.current;
    const from = drawn.current;
    const to = { x, y };
    if (!el || (from.x === x && from.y === y)) return;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      if (t === 1) {
        drawn.current = to;
        el.style.transform = parked(x, y);
        el.style.filter = '';
        return;
      }
      const pose = twirl(t, from, to);
      drawn.current = pose;
      el.style.transform = `${parked(pose.x, pose.y)} translateY(${CENTRE_Y}px) rotate(${pose.rot}deg) scaleX(${pose.turn}) translateY(${-CENTRE_Y}px)`;
      el.style.filter = `brightness(${0.5 + 0.5 * Math.abs(pose.turn)})`;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [x, y, durationMs]);

  return (
    <g ref={ref} data-testid="tardis" style={{ transform: parked(drawn.current.x, drawn.current.y) }}>
      <g className="tardis-bob">
        <g transform="scale(1.4)">
          <rect x={-4} y={-62} width={8} height={8} rx={2} className="tardis-lamp" />
          <rect x={-20} y={-54} width={40} height={6} fill="#163a80" />
          <rect x={-22} y={-48} width={44} height={8} fill="#0d1a33" />
          <text x={0} y={-42} fontSize={5} fill="#fff" textAnchor="middle">
            POLICE BOX
          </text>
          <rect x={-20} y={-40} width={40} height={48} fill="#1f4fa8" stroke="#163a80" strokeWidth={2} />
          {WINDOWS.map(([wx, wy]) => (
            <rect key={`${wx},${wy}`} x={wx} y={wy} width={14} height={11} fill={wy === -36 ? '#dfeaff' : '#163a80'} />
          ))}
          <line x1={0} y1={-40} x2={0} y2={8} stroke="#163a80" strokeWidth={2} />
        </g>
      </g>
    </g>
  );
}
