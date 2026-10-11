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

const reflog = (cwd: string) => lines(cwd, ['reflog', 'show', '--format=%H', 'HEAD']);

/** HEAD's reflog entries so far: pass it back to `readGraph` to show what later commands leave behind. */
export async function reflogLength(cwd: string) {
  return (await reflog(cwd)).length;
}

async function visitedSince(cwd: string, mark: number) {
  const visited = await reflog(cwd);
  // Each entry records where HEAD went; the one at the mark is where HEAD stood before the first move.
  return [...new Set(visited.slice(0, visited.length - mark + 1))];
}

export async function readGraph(cwd: string, reflogMark?: number): Promise<GraphModel> {
  if ((await git(cwd, ['rev-parse', '--git-dir'])).code !== 0) {
    return { initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } };
  }

  const since = reflogMark === undefined ? [] : await visitedSince(cwd, reflogMark);
  const lost = new Set(
    since.length ? await lines(cwd, ['rev-list', ...since, '--not', '--branches', '--tags', 'HEAD']) : [],
  );

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
    return { hash, short, message, parents: parents ? parents.split(' ') : [], ...(lost.has(hash) && { lost: true }) };
  });

  const branch = await git(cwd, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const hash = await git(cwd, ['rev-parse', '-q', '--verify', 'HEAD']);
  const mergeHead = await git(cwd, ['rev-parse', '-q', '--verify', 'MERGE_HEAD']);

  return {
    initialized: true,
    commits,
    branches: await refs(cwd, 'refs/heads'),
    tags: await refs(cwd, 'refs/tags'),
    head: {
      hash: hash.code === 0 ? hash.output.trim() : null,
      branch: branch.code === 0 ? branch.output.trim() : null,
    },
    ...(mergeHead.code === 0 && { mergeHead: mergeHead.output.trim() }),
  };
}
