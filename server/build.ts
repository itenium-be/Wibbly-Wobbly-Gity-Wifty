import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GitStep } from '../shared/types';
import { git } from './git';

export const ROSE_AIRED = 1111863600; // 2005-03-26 19:00 GMT
export const DAY = 86400;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function writeFiles(dir: string, files: Record<string, string>) {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), content);
  }
}

async function run(dir: string, args: string[], date: string) {
  const { output, code } = await git(dir, args, date);
  if (code !== 0) throw new Error(`git ${args.join(' ')} failed: ${output}`);
}

export async function buildSnapshot(dir: string, steps: GitStep[]) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [i, step] of steps.entries()) {
    // Fixed dates make every build produce the same hashes, so presenter notes stay valid.
    const date = `@${ROSE_AIRED + i * DAY} +0000`;
    if ('write' in step) await writeFiles(dir, step.write);
    else if ('git' in step) await run(dir, step.git, date);
    else {
      await writeFiles(dir, step.files ?? { [`episodes/${slug(step.commit)}.md`]: `# ${step.commit}\n` });
      await run(dir, ['add', '-A'], date);
      await run(dir, ['commit', '-q', '-m', step.commit], date);
    }
  }
}
