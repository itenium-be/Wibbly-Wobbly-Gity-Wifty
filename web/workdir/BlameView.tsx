import type { CSSProperties } from 'react';
import type { BlameHunk } from '../../shared/types';

type Props = { hunks: BlameHunk[]; openHash: string | null; onOpen: (hash: string) => void };

/** `--age`: 0 for the oldest commit in the file, 1 for the newest. */
export function BlameView({ hunks, openHash, onOpen }: Props) {
  const dates = [...new Set(hunks.map((h) => h.date))].sort();
  const age = (date: string) => (dates.length > 1 ? dates.indexOf(date) / (dates.length - 1) : 1);
  return (
    <div className="blame">
      {hunks.map((h, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: one commit can own several hunks, and hunks never reorder.
          key={i}
          className={h.hash === openHash ? 'hunk open' : 'hunk'}
          style={{ '--age': age(h.date) } as CSSProperties}
        >
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
