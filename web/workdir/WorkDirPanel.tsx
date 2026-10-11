import { useEffect, useRef, useState } from 'react';
import type { FileStatus, WorkDir } from '../../shared/types';

const LEGEND: FileStatus[] = ['untracked', 'modified', 'staged', 'conflicted'];

type Props = { workdir: WorkDir; branch: string };

export function WorkDirPanel({ workdir, branch }: Props) {
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const previous = useRef<Map<string, FileStatus>>(new Map());

  useEffect(() => {
    const before = previous.current;
    setFlashing(
      new Set(workdir.files.filter((f) => before.has(f.path) && before.get(f.path) !== f.status).map((f) => f.path)),
    );
    previous.current = new Map(workdir.files.map((f) => [f.path, f.status]));
  }, [workdir]);

  const unflash = (path: string) =>
    setFlashing((s) => {
      const next = new Set(s);
      next.delete(path);
      return next;
    });

  return (
    <aside className="workdir">
      <h3>
        <span>WORKING DIRECTORY</span>
        <span className={workdir.merging ? 'branch merging' : 'branch'}>
          {workdir.merging ? `${branch}|MERGING` : branch}
        </span>
      </h3>
      <div>
        <ul className="files">
          {workdir.files.map((f) => (
            <li
              key={f.path}
              className={`${f.status}${flashing.has(f.path) ? ' flash' : ''}`}
              onAnimationEnd={() => unflash(f.path)}
            >
              <span className="code">{f.code}</span>
              <span className="name">{f.path}</span>
              <span className="badge">{f.status}</span>
            </li>
          ))}
        </ul>
        <div className="legend">
          {LEGEND.map((s) => (
            <span key={s} className={s}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
