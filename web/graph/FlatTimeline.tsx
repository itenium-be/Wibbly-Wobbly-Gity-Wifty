import type { LaneKind, Layout, Node } from './layout';
import { Tardis } from './Tardis';

const X0 = 260;
const DX = 150;
const Y0 = 200;
const DY = 190;
// .message is 14px JetBrains Mono, whose glyphs advance 0.6em
const CHAR = 14 * 0.6;
const LABEL_GAP = 24;
const R = 13;
const PILL_X = 24;
const pillWidth = (name: string) => name.length * 9 + 16;
const isFixedPoint = (tag: string) => tag.startsWith('fixed-point/');

const KICKER: Record<LaneKind, string> = {
  prime: 'UNIVERSE · PRIME',
  branch: '',
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

type Props = {
  layout: Layout;
  codes?: Record<string, string>;
  dark?: Set<string>;
  zoom?: number;
  onSelect?: (hash: string, at: { x: number; y: number }) => void;
};

export function FlatTimeline({ layout, codes = {}, dark = new Set(), zoom = 1, onSelect }: Props) {
  const cols = Math.max(0, layout.pending?.col ?? 0, ...layout.nodes.map((n) => n.col));
  const labels = Array.from({ length: cols + 1 }, () => 0);
  for (const n of layout.nodes)
    labels[n.col] = Math.max(labels[n.col], n.message.length, codes[n.message]?.length ?? 0);
  if (layout.pending) labels[layout.pending.col] = Math.max(labels[layout.pending.col], 'uncommitted'.length);
  const pills = Array.from({ length: cols + 1 }, () => 0);
  for (const n of layout.nodes) for (const b of n.branches) pills[n.col] = Math.max(pills[n.col], pillWidth(b));
  const xs = [X0];
  for (let c = 1; c <= cols; c++)
    xs[c] =
      xs[c - 1] +
      Math.max(
        DX,
        ((labels[c - 1] + labels[c]) * CHAR) / 2 + LABEL_GAP,
        pills[c - 1] ? PILL_X + pills[c - 1] + R + LABEL_GAP : 0,
      );
  const at = (p: { col: number; lane: number }) => ({ x: xs[p.col], y: Y0 + p.lane * DY });
  const width = xs[cols] + 260;
  const height = Y0 + Math.max(1, layout.lanes.length) * DY;
  const curve = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    `C${a.x + DX * 0.6} ${a.y}, ${b.x - DX * 0.6} ${b.y}, ${b.x} ${b.y}`;
  // Bend in a single column gap so the long stretch runs along a lane instead of slicing through labels:
  // a fork bends right after its parent, a merge right before its merge commit.
  const link = (from: { col: number; lane: number }, to: { col: number; lane: number }, merge: boolean) => {
    const a = at(from);
    const b = at(to);
    if (a.y === b.y) return `M${a.x} ${a.y} L${b.x} ${b.y}`;
    if (merge) {
      const k = { x: xs[to.col - 1], y: a.y };
      return `M${a.x} ${a.y} L${k.x} ${k.y} ${curve(k, b)}`;
    }
    const k = { x: xs[from.col + 1], y: b.y };
    return `M${a.x} ${a.y} ${curve(a, k)} L${b.x} ${b.y}`;
  };
  const kind = (lane: number) => layout.lanes[lane]?.kind ?? 'prime';
  const tone = (n: Node) => (kind(n.lane) === 'prime' && dark.has(n.message) ? 'dark' : kind(n.lane));
  const tardis = at(layout.head ?? { col: 0, lane: 0 });

  return (
    <svg
      className="timeline"
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
      role="img"
      aria-label="timeline"
    >
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

      {layout.initialized && layout.nodes.length === 0 && !layout.pending && (
        <text x={width / 2} y={Y0} className="empty">
          An empty timeline
        </text>
      )}

      {layout.edges.map(({ from, to, merge }) => (
        <path key={`${from.hash}-${to.hash}`} d={link(from, to, merge)} className={`edge lane-${tone(to)}`} />
      ))}

      {layout.pending?.from && <path d={link(layout.pending.from, layout.pending, false)} className="edge pending" />}
      {layout.pending?.merge && <path d={link(layout.pending.merge, layout.pending, true)} className="edge pending" />}

      {layout.nodes.map((n) => {
        const { x, y } = at(n);
        return (
          <g key={n.hash}>
            {/* biome-ignore lint/a11y/noStaticElementInteractions: a mouse shortcut; the History tab shows the same diff. */}
            <g className="dot" onClick={(e) => onSelect?.(n.hash, { x: e.clientX, y: e.clientY })}>
              {n.tags.length > 0 ? (
                <polygon points={star(x, y, 22)} className={n.tags.some(isFixedPoint) ? 'fixed-point' : 'dark-star'} />
              ) : (
                <circle cx={x} cy={y} r={13} className={`node lane-${tone(n)}`} />
              )}
            </g>
            {codes[n.message] && (
              <text x={x} y={y + 42} className="episode-code">
                {codes[n.message]}
              </text>
            )}
            <text x={x} y={y + 60} className="message">
              {n.message}
            </text>
            <text x={x} y={y + 78} className="hash">
              {n.short}
            </text>
            {n.tags.map((t, i) => (
              <text key={t} x={x} y={y + 96 + i * 18} className={isFixedPoint(t) ? 'tag' : 'tag dark'}>
                ⚑ {t}
              </text>
            ))}
            {n.branches.map((b, i) => (
              <g key={b} className={`pill lane-${b === 'prime-timeline' ? 'prime' : 'parallel'}`}>
                <rect x={x + PILL_X} y={y - 13 + i * 30} width={pillWidth(b)} height={26} rx={6} />
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
          <circle cx={at(layout.pending).x} cy={at(layout.pending).y} r={13} className="node pending" />
          <text x={at(layout.pending).x} y={at(layout.pending).y + 42} className="message">
            uncommitted
          </text>
        </g>
      )}

      <Tardis x={tardis.x} y={tardis.y - 40} label={layout.head?.label} />
    </svg>
  );
}
