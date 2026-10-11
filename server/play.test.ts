import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { meetsExpectation, play } from './play';
import { sh } from './shell';

async function repo() {
  const dir = await tmp();
  await Bun.write(join(dir, 'TARDIS.md'), 'Doctor: The Ninth Doctor\nLocation: London, 2005\n');
  await sh(dir, 'git init -q && git add TARDIS.md && git commit -q -m Rose');
  return dir;
}

describe('play', () => {
  test('a command step runs its command', async () => {
    const dir = await repo();
    expect(await play(dir, { cmd: 'git log --format=%s', caption: '' }, {})).toEqual({
      cmd: 'git log --format=%s',
      output: 'Rose\n',
      code: 0,
    });
  });

  test('an episode step edits TARDIS.md and commits it under the episode title', async () => {
    const dir = await repo();
    const episode = { code: 'S01E08', title: "Father's Day", set: { Location: 'London, 1987' } };
    const played = await play(dir, { episode }, {});
    expect(played).toMatchObject({ cmd: `git commit -am "Father's Day"`, code: 0 });
    expect(await Bun.file(join(dir, 'TARDIS.md')).text()).toBe('Doctor: The Ninth Doctor\nLocation: London, 1987\n');
    expect((await sh(dir, 'git log -1 --format=%s')).output).toBe("Father's Day\n");
  });

  test('an edit step writes the files without committing', async () => {
    const dir = await repo();
    const played = await play(dir, { edit: { 'TARDIS.md': 'Doctor: The Tenth Doctor\n' }, caption: '' }, {});
    expect(played).toEqual({ cmd: 'edit TARDIS.md', output: '', code: 0 });
    expect(await Bun.file(join(dir, 'TARDIS.md')).text()).toBe('Doctor: The Tenth Doctor\n');
    expect((await sh(dir, 'git status --short')).output).toBe(' M TARDIS.md\n');
  });
});

describe('meetsExpectation', () => {
  test('a command must succeed unless it is expected to fail', () => {
    expect(meetsExpectation({ cmd: 'git log', caption: '' }, 0)).toBe(true);
    expect(meetsExpectation({ cmd: 'git log', caption: '' }, 128)).toBe(false);
    expect(meetsExpectation({ cmd: 'git status', caption: '', fails: true }, 128)).toBe(true);
    expect(meetsExpectation({ cmd: 'git status', caption: '', fails: true }, 0)).toBe(false);
  });

  test('an episode must succeed', () => {
    expect(meetsExpectation({ episode: { code: 'S01E02', title: 'x' } }, 1)).toBe(false);
  });
});
