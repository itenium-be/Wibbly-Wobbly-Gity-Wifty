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

export async function readGraph(cwd: string): Promise<GraphModel> {
  if ((await git(cwd, ['rev-parse', '--git-dir'])).code !== 0) {
    return { initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } };
  }

  const commits: Commit[] = (
    await lines(cwd, [
      'log',
      '--branches',
      '--tags',
      'HEAD',
      '--date-order',
      '--reverse',
      '--format=%H%x1f%h%x1f%P%x1f%s',
    ])
  ).map((row) => {
    const [hash, short, parents, message] = row.split(SEP);
    return { hash, short, message, parents: parents ? parents.split(' ') : [] };
  });

  const branch = await git(cwd, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const hash = await git(cwd, ['rev-parse', '-q', '--verify', 'HEAD']);

  return {
    initialized: true,
    commits,
    branches: await refs(cwd, 'refs/heads'),
    tags: await refs(cwd, 'refs/tags'),
    head: {
      hash: hash.code === 0 ? hash.output.trim() : null,
      branch: branch.code === 0 ? branch.output.trim() : null,
    },
  };
}
