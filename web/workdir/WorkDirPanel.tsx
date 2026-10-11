import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { FileStatus, WorkDir } from '../../shared/types';

const LEGEND: FileStatus[] = ['untracked', 'modified', 'staged', 'conflicted'];

type Props = {
  workdir: WorkDir;
  branch: string;
  load: (path: string) => Promise<string>;
  save: (path: string, content: string) => Promise<void>;
  /** Called after a click or edit ends, so the keyboard returns to the console. */
  onDone: () => void;
};

function Highlighted({ text }: { text: string }) {
  const lines = [];
  let side: 'ours' | 'theirs' | undefined;
  for (const [i, line] of text.replace(/\n$/, '').split('\n').entries()) {
    let kind: string | undefined = side;
    // Only a marker in sequence counts: a lone `=======` is also a markdown setext underline.
    const next = /^<{7} /.test(line)
      ? 'ours'
      : side === 'ours' && /^={7}$/.test(line)
        ? 'theirs'
        : side === 'theirs' && /^>{7} /.test(line)
          ? undefined
          : side;
    if (next !== side) {
      kind = 'marker';
      side = next;
    }
    lines.push(
      <span key={i} className={kind}>
        {line || ' '}
      </span>,
    );
  }
  return <pre>{lines}</pre>;
}

export function WorkDirPanel({ workdir, branch, load, save, onDone }: Props) {
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const previous = useRef<Map<string, FileStatus>>(new Map());
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const editor = useRef<HTMLTextAreaElement>(null);

  const open = workdir.files.find((f) => f.path === openPath);

  useEffect(() => {
    const before = previous.current;
    setFlashing(
      new Set(workdir.files.filter((f) => before.has(f.path) && before.get(f.path) !== f.status).map((f) => f.path)),
    );
    previous.current = new Map(workdir.files.map((f) => [f.path, f.status]));
  }, [workdir]);

  const openFile = open?.path;
  // biome-ignore lint/correctness/useExhaustiveDependencies: a command (merge, checkout) may rewrite the open file, so every new workdir reloads it.
  useEffect(() => {
    if (!openFile) return;
    let current = true;
    load(openFile)
      .then((text) => {
        if (!current) return;
        setContent(text);
        setError('');
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      current = false;
    };
  }, [openFile, workdir, load]);

  const editing = draft !== null;
  useEffect(() => {
    if (editing) editor.current?.focus();
  }, [editing]);

  const unflash = (path: string) =>
    setFlashing((s) => {
      const next = new Set(s);
      next.delete(path);
      return next;
    });

  const select = (path: string) => {
    setOpenPath(path);
    setContent(null);
    setDraft(null);
    setError('');
    onDone();
  };

  const onSave = async () => {
    if (!openPath || draft === null) return;
    try {
      await save(openPath, draft);
      setDraft(null);
      setError('');
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const onEditorKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Escape') return;
    setDraft(null);
    onDone();
  };

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
              className={`${f.status}${f === open ? ' open' : ''}${flashing.has(f.path) ? ' flash' : ''}`}
              onAnimationEnd={() => unflash(f.path)}
            >
              <button type="button" onClick={() => select(f.path)}>
                <span className="code">{f.code}</span>
                <span className="name">{f.path}</span>
                <span className="badge">{f.status}</span>
              </button>
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
      {open && (
        <div className="viewer">
          <div className="bar">
            <span>{`${open.path} — ${open.status}`}</span>
            {error && <span className="error">{error}</span>}
            {editing ? (
              <button type="button" onClick={onSave}>
                Save
              </button>
            ) : (
              <button type="button" disabled={content === null} onClick={() => setDraft(content)}>
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <textarea
              ref={editor}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onEditorKey}
              spellCheck={false}
              aria-label={`edit ${open.path}`}
            />
          ) : (
            content !== null && <Highlighted text={content} />
          )}
        </div>
      )}
    </aside>
  );
}
