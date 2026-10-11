import { useState } from 'react';
import type { GraphModel } from '../../shared/types';
import { CommitView } from './CommitView';
import { type HistoryEdge, history, type Scope } from './history';

const ROW = 38;
const LANE = 20;
const PAD = 14;
const COLORS = 4;

const x = (lane: number) => PAD + lane * LANE;
const y = (row: number) => row * ROW + ROW / 2;
const color = (lane: number) => `lane-${lane % COLORS}`;

function route(e: HistoryEdge): string {
  const [fromX, viaX, toX, toY] = [x(e.fromLane), x(e.via), x(e.toLane), y(e.to)];
  let [cx, cy] = [fromX, y(e.from)];
  let d = `M${cx},${cy}`;
  const curve = (tx: number, ty: number) => {
    const mid = (cy + ty) / 2;
    d += ` C${cx},${mid} ${tx},${mid} ${tx},${ty}`;
    [cx, cy] = [tx, ty];
  };
  if (e.to - e.from === 1) {
    curve(toX, toY);
    return d;
  }
  if (viaX !== fromX) curve(viaX, cy + ROW);
  cy = viaX === toX ? toY : toY - ROW;
  d += ` V${cy}`;
  if (viaX !== toX) curve(toX, toY);
  return d;
}

type Props = {
  graph: GraphModel;
  show: (hash: string) => Promise<string>;
  onDone: () => void;
};

export function HistoryView({ graph, show, onDone }: Props) {
  const [scope, setScope] = useState<Scope>('all');
  const [openHash, setOpenHash] = useState<string | null>(null);
  const { rows, edges, lanes } = history(graph, scope);
  const gutter = PAD * 2 + Math.max(lanes - 1, 0) * LANE;
  const open = rows.find((r) => r.commit.hash === openHash);

  return (
    <>
      <div className="history">
        <div className="scope">
          {(['head', 'all'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={scope === s} onClick={() => setScope(s)}>
              {s === 'head' ? 'HEAD' : '--all'}
            </button>
          ))}
        </div>
        <div className="log">
          <svg width={gutter} height={rows.length * ROW} aria-hidden="true">
            {edges.map((e) => (
              <path key={`${e.from}-${e.to}`} className={color(e.via)} d={route(e)} />
            ))}
            {rows.map((r, i) => (
              <circle
                key={r.commit.hash}
                className={`${color(r.lane)}${r.head ? ' head' : ''}${r.commit.parents.length > 1 ? ' merge' : ''}`}
                cx={x(r.lane)}
                cy={y(i)}
                r={r.commit.parents.length > 1 ? 7 : 6}
              />
            ))}
          </svg>
          <ul>
            {rows.map((r) => (
              <li
                key={r.commit.hash}
                className={r === open ? 'open' : undefined}
                style={{ height: ROW, paddingLeft: gutter }}
              >
                <button
                  type="button"
                  className="commit"
                  onClick={() => {
                    setOpenHash(r.commit.hash);
                    onDone();
                  }}
                >
                  <span className="hash">{r.commit.short}</span>
                  <span className="msg">
                    {r.refs.map((ref) => (
                      <span key={ref.name} className={`ref ${ref.kind} ${color(r.lane)}`}>
                        {ref.name}
                      </span>
                    ))}
                    <span>{r.commit.message}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {open && <CommitView commit={open.commit} refs={open.refs} show={show} />}
    </>
  );
}
