import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { BlameHunk, FileStatus, GraphModel, WorkDir } from '../../shared/types';
import { ResizeHandle } from '../ResizeHandle';
import { BlameView } from './BlameView';
import { CommitDiff } from './CommitView';
import { HistoryView } from './HistoryView';

type Props = {
  workdir: WorkDir;
  branch: string;
  graph: GraphModel;
  load: (path: string) => Promise<string>;
  show: (hash: string) => Promise<string>;
  blame: (path: string) => Promise<BlameHunk[]>;
  /** Opens `path` in blame mode; `n` changes so the same file can be requested twice. */
  blameRequest?: { path: string; n: number };
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

export function WorkDirPanel({ workdir, branch, graph, load, show, blame, blameRequest, save, onDone }: Props) {
  const [tab, setTab] = useState<'files' | 'history'>('files');
  const [flashing, setFlashing] = useState<Set<string>>(new Set());
  const previous = useRef<Map<string, FileStatus>>(new Map());
  const [openPath, setOpenPath] = useState<string | null>('TARDIS.md');
  const [content, setContent] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [blaming, setBlaming] = useState(false);
  const [hunks, setHunks] = useState<BlameHunk[] | null>(null);
  const [blameHash, setBlameHash] = useState<string | null>(null);
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

  useEffect(() => {
    if (!blameRequest) return;
    setTab('files');
    setOpenPath(blameRequest.path);
    setContent(null);
    setDraft(null);
    setError('');
    setBlaming(true);
    setBlameHash(null);
  }, [blameRequest]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a commit changes the blame, so every new workdir reloads it.
  useEffect(() => {
    if (!blaming || !openFile) return;
    let current = true;
    setHunks(null);
    blame(openFile)
      .then((loaded) => {
        if (current) setHunks(loaded);
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      current = false;
    };
  }, [blaming, openFile, workdir, blame]);

  const toggleBlame = () => {
    setBlaming((b) => !b);
    setBlameHash(null);
    setError('');
    onDone();
  };

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
    // Clearing the content of the open file would never reload it: the load effect only reruns when the path changes.
    if (path === openPath) return onDone();
    setOpenPath(path);
    setContent(null);
    setDraft(null);
    setError('');
    setBlameHash(null);
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

  const changed = workdir.files.filter((f) => f.status !== 'clean').length;

  return (
    <aside className="workdir">
      <ResizeHandle edge="left" variable="--workdir-width" min={320} />
      <h3>
        <span className="tabs" role="tablist">
          <button
            type="button"
            className="tab"
            role="tab"
            aria-selected={tab === 'files'}
            onClick={() => setTab('files')}
          >
            dir
            {changed > 0 && <span className="count">{changed}</span>}
          </button>
          <button
            type="button"
            className="tab"
            role="tab"
            aria-selected={tab === 'history'}
            onClick={() => setTab('history')}
          >
            log
          </button>
        </span>
        <span className={workdir.merging ? 'branch merging' : 'branch'}>
          {workdir.merging ? `${branch}|MERGING` : branch}
        </span>
      </h3>
      {tab === 'history' && <HistoryView graph={graph} show={show} onDone={onDone} />}
      {tab === 'files' && (
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
        </div>
      )}
      {tab === 'files' && open && (
        <div className="viewer">
          <div className="bar">
            <span>{`${open.path} — ${open.status}`}</span>
            {error && <span className="error">{error}</span>}
            {editing ? (
              <button type="button" onClick={onSave}>
                Save
              </button>
            ) : (
              <>
                <button type="button" aria-pressed={blaming} onClick={toggleBlame}>
                  Blame
                </button>
                <button
                  type="button"
                  disabled={content === null}
                  onClick={() => {
                    setBlaming(false);
                    setDraft(content);
                  }}
                >
                  Edit
                </button>
              </>
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
          ) : blaming ? (
            hunks && (
              <BlameView
                hunks={hunks}
                openHash={blameHash}
                onOpen={(hash) => {
                  setBlameHash(hash);
                  onDone();
                }}
              />
            )
          ) : (
            content !== null && <Highlighted text={content} />
          )}
        </div>
      )}
      {tab === 'files' && blaming && blameHash && (
        <div className="viewer commit-view">
          <CommitDiff hash={blameHash} show={show} />
        </div>
      )}
    </aside>
  );
}
