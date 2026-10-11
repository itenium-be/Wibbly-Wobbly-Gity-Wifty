import type { BlameHunk } from '../../shared/types';

type Props = { hunks: BlameHunk[]; openHash: string | null; onOpen: (hash: string) => void };

export function BlameView({ hunks, openHash, onOpen }: Props) {
  return (
    <div className="blame">
      {hunks.map((h, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: one commit can own several hunks, and hunks never reorder.
        <div key={i} className={h.hash === openHash ? 'hunk open' : 'hunk'}>
          <button type="button" className="who" disabled={/^0+$/.test(h.hash)} onClick={() => onOpen(h.hash)}>
            <span className="summary">{h.summary}</span>
            <span className="meta">{`${h.author} · ${h.date}`}</span>
          </button>
          <pre>
            {h.lines.map((line, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lines repeat and never reorder.
              <span key={j}>{line || ' '}</span>
            ))}
          </pre>
        </div>
      ))}
    </div>
  );
}
