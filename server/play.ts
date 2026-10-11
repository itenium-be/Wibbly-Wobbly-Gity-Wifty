import { join } from 'node:path';
import type { Step } from '../shared/types';
import { type ShellResult, type StageOptions, sh } from './shell';
import { applyEpisode } from './tardis';

export const TARDIS_MD = 'TARDIS.md';

export type Played = ShellResult & { cmd: string };

export async function play(dir: string, step: Step, options: StageOptions): Promise<Played> {
  if ('cmd' in step) return { cmd: step.cmd, ...(await sh(dir, step.cmd, options)) };
  const path = join(dir, TARDIS_MD);
  await Bun.write(path, applyEpisode(await Bun.file(path).text(), step.episode));
  const cmd = `git commit -am "${step.episode.title}"`;
  return { cmd, ...(await sh(dir, cmd, options)) };
}

export const meetsExpectation = (step: Step, code: number) => ('cmd' in step && step.fails ? code !== 0 : code === 0);
