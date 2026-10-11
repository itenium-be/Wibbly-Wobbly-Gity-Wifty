import { dirname, join, resolve } from 'node:path';

const GITCONFIG = join(import.meta.dir, 'tardis.gitconfig');

export type GitResult = { output: string; code: number };

export async function git(cwd: string, args: string[], date?: string, timeoutMs = 10_000): Promise<GitResult> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    LANG: 'C',
    // The presenter's own git config must not leak into the timeline.
    GIT_CONFIG_GLOBAL: GITCONFIG,
    GIT_CONFIG_NOSYSTEM: '1',
    // Before `git init`, the live dir must not resolve to an enclosing repo.
    GIT_CEILING_DIRECTORIES: dirname(resolve(cwd)),
    GIT_EDITOR: 'true',
    GIT_TERMINAL_PROMPT: '0',
  };
  if (date) Object.assign(env, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });

  const proc = Bun.spawn(['git', ...args], { cwd, env, stdout: 'pipe', stderr: 'pipe', timeout: timeoutMs });
  const [stdout, stderr, code] = await Promise.all([
    Bun.readableStreamToText(proc.stdout),
    Bun.readableStreamToText(proc.stderr),
    proc.exited,
  ]);
  if (proc.signalCode) {
    const note = `git ${args[0]} timed out after ${timeoutMs / 1000}s`;
    return { output: `${stdout}${stderr}${stdout || stderr ? '\n' : ''}${note}`, code };
  }
  return { output: stdout + stderr, code };
}
