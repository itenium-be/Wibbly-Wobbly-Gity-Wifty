export type DiffLine = { kind: 'add' | 'del' | 'ctx'; text: string };
export type DiffFile = {
  path: string;
  status: 'new' | 'deleted' | 'modified';
  added: number;
  removed: number;
  lines: DiffLine[];
};

const KINDS: Record<string, DiffLine['kind']> = { '+': 'add', '-': 'del', ' ': 'ctx' };

/** Parses `git show --format=` output. Inside a hunk, `---`/`+++` are content lines, not file headers. */
export function parseDiff(text: string): DiffFile[] {
  const files: DiffFile[] = [];
  let file: DiffFile | undefined;
  let inHunk = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('diff --git ')) {
      file = { path: line.slice(line.lastIndexOf(' b/') + 3), status: 'modified', added: 0, removed: 0, lines: [] };
      files.push(file);
      inHunk = false;
    } else if (!file) continue;
    else if (line.startsWith('@@')) inHunk = true;
    else if (inHunk) {
      const kind = KINDS[line[0]];
      if (!kind) continue;
      file.lines.push({ kind, text: line.slice(1) });
      if (kind === 'add') file.added++;
      if (kind === 'del') file.removed++;
    } else if (line.startsWith('new file mode')) file.status = 'new';
    else if (line.startsWith('deleted file mode')) file.status = 'deleted';
  }
  return files;
}
