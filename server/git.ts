import { type ShellResult, spawn } from './shell';

export type GitResult = ShellResult;

export const git = (cwd: string, args: string[], date?: string, timeoutMs = 10_000): Promise<GitResult> =>
  spawn(['git', ...args], cwd, { date }, timeoutMs, `git ${args[0]}`);
