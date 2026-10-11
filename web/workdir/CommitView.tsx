import { useEffect, useState } from 'react';
import type { Commit } from '../../shared/types';
import { type DiffFile, parseDiff } from './diff';
import type { RefLabel } from './history';

function details(commit: Commit, refs: RefLabel[]) {
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
          {f.lines.map((l, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: diff lines repeat and never reorder.
            <div key={i} className={`ln ${l.kind}`}>
              <span>{SIGN[l.kind]}</span>
              <span>{l.text}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

type Props = { commit: Commit; refs: RefLabel[]; show: (hash: string) => Promise<string> };

export function CommitView({ commit, refs, show }: Props) {
  const [files, setFiles] = useState<DiffFile[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setFiles(null);
    setError('');
    show(commit.hash)
      .then((text) => {
        if (current) setFiles(parseDiff(text));
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      current = false;
    };
  }, [commit.hash, show]);

  return (
    <div className="viewer commit-view">
      {details(commit, refs)}
      {error ? <div className="error">{error}</div> : files && <Diff files={files} />}
    </div>
  );
}
