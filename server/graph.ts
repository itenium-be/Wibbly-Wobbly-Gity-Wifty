import { join } from 'node:path';
import type { Commit, GraphModel, Ref } from '../shared/types';
import { git } from './git';

const SEP = '\x1f';

async function lines(cwd: string, args: string[]) {
  const { output, code } = await git(cwd, args);
  return code === 0 ? output.split('\n').filter(Boolean) : [];
}

async function refs(cwd: string, namespace: string): Promise<Ref[]> {
  const rows = await lines(cwd, [
    'for-each-ref',
    '--format=%(refname:lstrip=2)%1f%(objectname)%1f%(*objectname)',
    namespace,
  ]);
  return rows.map((row) => {
    const [name, hash, peeled] = row.split(SEP);
    return { name, hash: peeled || hash };
  });
}

// Read as a file rather than with `git reflog`: readGraph runs after every command, and each git spawn adds up.
const reflog = (cwd: string) => Bun.file(join(cwd, '.git', 'logs', 'HEAD'));
const NO_COMMIT = /^0+$/;

/** HEAD's reflog so far: pass it back to `readGraph` to show what later commands leave behind. */
export async function reflogSize(cwd: string) {
  return (await reflog(cwd).exists()) ? reflog(cwd).size : 0;
}

/** Every commit HEAD moved from or to since the mark: each entry starts `<old> <new> `. */
async function visitedSince(cwd: string, mark: number) {
  if (!(await reflog(cwd).exists())) return [];
  const entries = (await reflog(cwd).slice(mark).text()).split('\n').filter(Boolean);
  const hashes = entries.flatMap((e) => e.split(' ', 2)).filter((h) => !NO_COMMIT.test(h));
  return [...new Set(hashes)];
}

export async function readGraph(cwd: string, reflogMark?: number): Promise<GraphModel> {
  if ((await git(cwd, ['rev-parse', '--git-dir'])).code !== 0) {
    return { initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } };
  }

  const since = reflogMark === undefined ? [] : await visitedSince(cwd, reflogMark);
  const branches = await refs(cwd, 'refs/heads');
  const tags = await refs(cwd, 'refs/tags');
  const branch = await git(cwd, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const hash = await git(cwd, ['rev-parse', '-q', '--verify', 'HEAD']);
  const mergeHead = await git(cwd, ['rev-parse', '-q', '--verify', 'MERGE_HEAD']);
  const head = hash.code === 0 ? hash.output.trim() : null;

  const commits: Commit[] = (
    await lines(cwd, [
      'log',
      '--branches',
      '--tags',
      'HEAD',
      ...since,
      '--date-order',
      '--reverse',
      '--format=%H%x1f%h%x1f%P%x1f%s',
    ])
  ).map((row) => {
    const [hash, short, parents, message] = row.split(SEP);
    return { hash, short, message, parents: parents ? parents.split(' ') : [] };
  });

  if (since.length) {
    const parents = new Map(commits.map((c) => [c.hash, c.parents]));
    const reachable = new Set<string>();
    const stack = [...branches, ...tags].map((r) => r.hash).concat(head ?? []);
    for (let h = stack.pop(); h !== undefined; h = stack.pop())
      if (!reachable.has(h)) {
        reachable.add(h);
        stack.push(...(parents.get(h) ?? []));
      }
    for (const c of commits) if (!reachable.has(c.hash)) c.lost = true;
  }

  return {
    initialized: true,
    commits,
    branches,
    tags,
    head: { hash: head, branch: branch.code === 0 ? branch.output.trim() : null },
    ...(mergeHead.code === 0 && { mergeHead: mergeHead.output.trim() }),
  };
}
