import type { LaneKind, Layout } from './layout';
import { Tardis } from './Tardis';

const X0 = 260;
const DX = 150;
const Y0 = 200;
const DY = 190;

const at = (p: { col: number; lane: number }) => ({ x: X0 + p.col * DX, y: Y0 + p.lane * DY });

const KICKER: Record<LaneKind, string> = {
  prime: 'UNIVERSE · PRIME',
  parallel: 'UNIVERSE · PARALLEL',
  detached: 'OFF THE TIMELINE',
};

function star(x: number, y: number, r: number) {
  return Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(' ');
}

export function FlatTimeline({ layout }: { layout: Layout }) {
  const cols = Math.max(0, layout.pending?.col ?? 0, ...layout.nodes.map((n) => n.col));
  const width = X0 + cols * DX + 260;
  const height = Y0 + Math.max(1, layout.lanes.length) * DY;
  const kind = (lane: number) => layout.lanes[lane]?.kind ?? 'prime';
  const tardis = at(layout.head ?? { col: 0, lane: 0 });

  return (
    <svg className="timeline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="timeline">
      {layout.lanes.map((lane, i) => (
        <g key={lane.name}>
          <line x1={40} x2={width - 40} y1={Y0 + i * DY} y2={Y0 + i * DY} className="lane-line" />
          <text x={40} y={Y0 + i * DY - 52} className="lane-kicker">
            {KICKER[lane.kind]}
          </text>
          <text x={40} y={Y0 + i * DY - 30} className="lane-name">
            {lane.name}
          </text>
        </g>
      ))}

      {layout.nodes.length === 0 && !layout.pending && (
        <text x={width / 2} y={Y0} className="empty">
          {layout.initialized ? 'An empty timeline' : 'Not a git repository'}
        </text>
      )}

      {layout.edges.map(({ from, to }) => {
        const a = at(from);
        const b = at(to);
        const d =
          a.y === b.y
            ? `M${a.x} ${a.y} L${b.x} ${b.y}`
            : `M${a.x} ${a.y} C${a.x + DX * 0.6} ${a.y}, ${b.x - DX * 0.6} ${b.y}, ${b.x} ${b.y}`;
        return <path key={`${from.hash}-${to.hash}`} d={d} className={`edge lane-${kind(to.lane)}`} />;
      })}

      {layout.nodes.map((n) => {
        const { x, y } = at(n);
        return (
          <g key={n.hash}>
            {n.tags.length > 0 ? (
              <polygon points={star(x, y, 22)} className="fixed-point" />
            ) : (
              <circle cx={x} cy={y} r={13} className={`node lane-${kind(n.lane)}`} />
            )}
            <text x={x} y={y + 42} className="message">
              {n.message}
            </text>
            <text x={x} y={y + 60} className="hash">
              {n.short}
            </text>
            {n.tags.map((t, i) => (
              <text key={t} x={x} y={y + 78 + i * 18} className="tag">
                ⚑ {t}
              </text>
            ))}
            {n.branches.map((b, i) => (
              <g key={b} className={`pill lane-${b === 'prime-timeline' ? 'prime' : 'parallel'}`}>
                <rect x={x + 24} y={y - 13 + i * 30} width={b.length * 9 + 16} height={26} rx={6} />
                <text x={x + 32} y={y + 5 + i * 30}>
                  {b}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      {layout.pending && (
        <g className="pending">
          {layout.pending.from && (
            <path
              d={`M${at(layout.pending.from).x} ${at(layout.pending.from).y} L${at(layout.pending).x} ${at(layout.pending).y}`}
              className="edge pending"
            />
          )}
          <circle cx={at(layout.pending).x} cy={at(layout.pending).y} r={13} className="node pending" />
          <text x={at(layout.pending).x} y={at(layout.pending).y + 42} className="message">
            uncommitted
          </text>
        </g>
      )}

      <Tardis x={tardis.x} y={tardis.y - 40} />
      {layout.head && (
        <text x={tardis.x} y={tardis.y - 140} className="head-label">
          {layout.head.label}
        </text>
      )}
    </svg>
  );
}
