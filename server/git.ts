import { dirname, join } from 'node:path';

const GITCONFIG = join(import.meta.dir, 'tardis.gitconfig');

export type GitResult = { output: string; code: number };

export async function git(cwd: string, args: string[], date?: string): Promise<GitResult> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    LANG: 'C',
    // The presenter's own git config must not leak into the timeline.
    GIT_CONFIG_GLOBAL: GITCONFIG,
    GIT_CONFIG_NOSYSTEM: '1',
    // Before `git init`, the live dir must not resolve to an enclosing repo.
    GIT_CEILING_DIRECTORIES: dirname(cwd),
    GIT_EDITOR: 'true',
    GIT_TERMINAL_PROMPT: '0',
  };
  if (date) Object.assign(env, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });

  const proc = Bun.spawn(['git', ...args], { cwd, env, stdout: 'pipe', stderr: 'pipe', timeout: 10_000 });
  const [stdout, stderr, code] = await Promise.all([
    Bun.readableStreamToText(proc.stdout),
    Bun.readableStreamToText(proc.stderr),
    proc.exited,
  ]);
  return { output: stdout + stderr, code };
}
