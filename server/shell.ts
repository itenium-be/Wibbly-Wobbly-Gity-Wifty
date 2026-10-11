import { dirname, join, resolve } from 'node:path';

export const GITCONFIG = join(import.meta.dir, 'tardis.gitconfig');

export type ShellResult = { output: string; code: number };
export type StageOptions = { config?: string; date?: string; color?: boolean };

function stageEnv(cwd: string, { config = GITCONFIG, date, color }: StageOptions): Record<string, string> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    LANG: 'C',
    // The presenter's own git config must not leak into the timeline.
    GIT_CONFIG_GLOBAL: config,
    GIT_CONFIG_NOSYSTEM: '1',
    // Before `git init`, the live dir must not resolve to an enclosing repo.
    GIT_CEILING_DIRECTORIES: dirname(resolve(cwd)),
    GIT_EDITOR: 'true',
    GIT_TERMINAL_PROMPT: '0',
    // No TTY: anything that pages would hang the request.
    PAGER: 'cat',
    GIT_PAGER: 'cat',
  };
  // Command-line scope: outranks the global config, so `git config --global color.ui` can't turn it off mid-talk.
  if (color) Object.assign(env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'color.ui', GIT_CONFIG_VALUE_0: 'always' });
  if (date) Object.assign(env, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
  return env;
}

export async function spawn(
  cmd: string[],
  cwd: string,
  options: StageOptions,
  timeoutMs: number,
  label: string,
): Promise<ShellResult> {
  // Own process group, so a timeout reaches pipeline members that would otherwise hold stdout open.
  const proc = Bun.spawn(['setsid', '-w', ...cmd], {
    cwd,
    env: stageEnv(cwd, options),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    try {
      process.kill(-proc.pid, 'SIGKILL');
    } catch {
      // ESRCH: the group can exit between the last write and the timer.
    }
  }, timeoutMs);
  const [stdout, stderr, code] = await Promise.all([
    Bun.readableStreamToText(proc.stdout),
    Bun.readableStreamToText(proc.stderr),
    proc.exited,
  ]);
  clearTimeout(timer);
  if (timedOut) {
    const note = `${label} timed out after ${timeoutMs / 1000}s`;
    return { output: `${stdout}${stderr}${stdout || stderr ? '\n' : ''}${note}`, code };
  }
  return { output: stdout + stderr, code };
}

export const sh = (cwd: string, line: string, options: StageOptions = {}, timeoutMs = 10_000) =>
  spawn(['bash', '-c', line], cwd, options, timeoutMs, `\`${line}\``);
