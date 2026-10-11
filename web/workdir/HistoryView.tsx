import { useEffect, useState } from 'react';
import type { GraphModel } from '../../shared/types';
import { type DiffFile, parseDiff } from './diff';
import { type HistoryEdge, type HistoryRow, history, type Scope } from './history';

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

function details(row: HistoryRow) {
  const { commit, refs } = row;
  const names = refs.length ? ` (${refs.map((r) => r.name).join(', ')})` : '';
  const merge = commit.parents.length > 1 ? `Merge: ${commit.parents.map((p) => p.slice(0, 7)).join(' ')}\n` : '';
  return (
    <pre>
      <span className="hash">commit {commit.hash}</span>
      {`${names}\n${merge}\n    ${commit.message}`}
    </pre>
  );
}

const SIGN = { add: '+', del: '-', ctx: ' ' };

function Diff({ files }: { files: DiffFile[] }) {
  return (
    <div className="diff">
      {files.map((f) => (
        <section key={f.path}>
          <div className="file">
            <span>
              {f.path}
              {f.status !== 'modified' && <span className="stat"> ({f.status} file)</span>}
            </span>
            <span className="stat">
              {f.added > 0 && <b>+{f.added}</b>}
              {f.added > 0 && f.removed > 0 && ' '}
              {f.removed > 0 && <i>−{f.removed}</i>}
            </span>
          </div>
          {f.lines.map((l, i) =>
            l.kind === 'hunk' ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: diff lines repeat and never reorder.
              <div key={i} className="hunk">
                {l.text}
              </div>
            ) : (
              // biome-ignore lint/suspicious/noArrayIndexKey: diff lines repeat and never reorder.
              <div key={i} className={`ln ${l.kind}`}>
                <span>{SIGN[l.kind]}</span>
                <span>{l.text}</span>
              </div>
            ),
          )}
        </section>
      ))}
    </div>
  );
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
  const [files, setFiles] = useState<DiffFile[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!openHash) return;
    let current = true;
    setFiles(null);
    setError('');
    show(openHash)
      .then((text) => {
        if (current) setFiles(parseDiff(text));
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      current = false;
    };
  }, [openHash, show]);

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
      {open && (
        <div className="viewer commit-view">
          {details(open)}
          {error ? <div className="error">{error}</div> : files && <Diff files={files} />}
        </div>
      )}
    </>
  );
}
