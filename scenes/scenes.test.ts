import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { Engine } from '../server/engine';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { scenes } from '.';

async function playScene(engine: Engine, scene: Scene) {
  await engine.enter(scene.id);
  for (const step of scene.steps) {
    if ('cmd' in step) await engine.run(step.cmd);
    else if ('edit' in step)
      for (const [path, content] of Object.entries(step.edit)) await engine.writeFile(path, content);
    else await engine.episode(step.episode.code);
  }
}

describe('scenes', () => {
  let engine: Engine;
  beforeAll(async () => {
    engine = new Engine(await tmp(), scenes);
    // prepare plays every step of every scene and throws on an unexpected exit code.
    await engine.prepare();
  });

  test('ids are unique', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });

  test('episode titles survive double quotes in bash', () => {
    const titles = scenes.flatMap((s) => s.steps.flatMap((step) => ('episode' in step ? [step.episode.title] : [])));
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(title).not.toMatch(/["$`\\]/);
  });

  test('rose starts with an untracked TARDIS log and no repo', async () => {
    const { graph, workdir } = await engine.enter('rose');
    expect(graph.initialized).toBe(false);
    expect(await engine.readFile('TARDIS.md')).toContain('Companions:\n- Rose Tyler\n');
    expect(workdir.files.map((f) => f.path)).toEqual(['TARDIS.md']);
  });

  const sceneOf = (id: string) => scenes.find((s) => s.id === id) as Scene;
  const out = async (cmd: string) => (await engine.run(cmd)).output;

  test("father's day starts where Rose ended, st alias included", async () => {
    const { graph } = await engine.enter('fathers-day');
    expect(graph.commits.map((c) => c.message)).toEqual(['Rose']);
    expect((await engine.run('git st')).code).toBe(0);
  });

  test("father's day merge is a paradox on Pete Tyler, and the fixed point survives", async () => {
    const scene = sceneOf('fathers-day');
    const merge = scene.steps.findIndex((s) => 'cmd' in s && s.cmd === 'git merge pete-lives');
    await playScene(engine, { ...scene, steps: scene.steps.slice(0, merge + 1) });
    const conflict = await engine.readFile('TARDIS.md');
    expect(conflict).toContain('Pete Tyler: dead\n=======\n');
    expect(conflict).toContain('Pete Tyler: alive\n>>>>>>> pete-lives');
    await playScene(engine, scene);
    expect(await out("git branch --format='%(refname:short)'")).toBe('prime-timeline\n');
    expect(await out('git log -1 --format=%s fixed-point/pete')).toBe("Father's Day\n");
    expect(await out('git status --short')).toBe('');
  });

  test('the parting of the ways regenerates the Doctor by amending the episode', async () => {
    const scene = sceneOf('parting-of-the-ways');
    const amend = scene.steps.findIndex((s) => 'cmd' in s && s.cmd.includes('--amend'));
    await playScene(engine, { ...scene, steps: scene.steps.slice(0, amend) });
    expect(await out('git show HEAD:TARDIS.md')).toContain('Doctor: The Ninth Doctor\n');
    expect(await engine.readFile('TARDIS.md')).toContain('Doctor: The Tenth Doctor\n');
    const ninth = await out('git rev-parse HEAD');

    await engine.run((scene.steps[amend] as { cmd: string }).cmd);
    expect(await out('git log --format=%s -2')).toBe('The Parting of the Ways\nBad Wolf\n');
    expect(await out('git show HEAD:TARDIS.md')).toContain('Doctor: The Tenth Doctor\n');
    expect(await out('git rev-parse HEAD')).not.toBe(ninth);
    expect(await out('git status --short')).toBe('');
  });

  test("pete's world branches off after Series 1 and diverges on both sides", async () => {
    await playScene(engine, sceneOf('petes-world'));
    expect(await out('git log --format=%s -2 petes-world')).toBe('Doomsday\nRise of the Cybermen\n');
    expect(await out('git log -1 --format=%s $(git merge-base petes-world prime-timeline)')).toBe(
      'The Parting of the Ways\n',
    );
  });

  test('the timeline reads in broadcast order', async () => {
    const { graph } = await engine.enter('journeys-end');
    expect(graph.commits.map((c) => c.message)).toEqual([
      'Rose',
      "Father's Day",
      'Bad Wolf',
      'The Parting of the Ways',
      'Rise of the Cybermen',
      'Doomsday',
      'Blink',
      'Forest of the Dead',
      'The Stolen Earth',
    ]);
  });

  test("journey's end conflicts on the companion and resolves into a merge commit", async () => {
    const scene = sceneOf('journeys-end');
    await engine.enter(scene.id);
    expect((await engine.run('git merge petes-world')).code).not.toBe(0);
    expect(await engine.readFile('TARDIS.md')).toContain(
      'Companions:\n<<<<<<< HEAD\n- Donna Noble\n- Martha Jones\n- Sarah Jane Smith\n- Captain Jack Harkness\n',
    );
    await playScene(engine, scene);
    expect(await out('git log -1 --format=%p')).toMatch(/^\w+ \w+\n$/);
    expect(await out("git branch --format='%(refname:short)'")).toBe('prime-timeline\n');
  });

  test('blink bisects to the episode that let the Angel in', async () => {
    const scene = sceneOf('blink');
    const run = scene.steps.findIndex((s) => 'cmd' in s && s.cmd.startsWith('git bisect run'));
    await playScene(engine, { ...scene, steps: scene.steps.slice(0, run) });
    const step = scene.steps[run] as { cmd: string };
    expect((await engine.run(step.cmd)).output).toMatch(/is the first bad commit[\s\S]*\n {4}Blink\n/);
  });

  test('blink fixes forward: a new commit drops the Angel', async () => {
    await playScene(engine, sceneOf('blink'));
    expect(await out('git log --format=%s -1')).toBe('Angels quantum-locked\n');
    expect(await out('git show HEAD:TARDIS.md')).not.toContain('Angel');
    expect(await out('git show HEAD~1:TARDIS.md')).toContain('Angel');
    expect(await out('git status --short')).toBe('');
  });

  test("river's diary brings back the branch where Rose saved Pete", async () => {
    await playScene(engine, sceneOf('rivers-diary'));
    expect(await out('git log --format=%s -1 pete-lives')).toBe('Rose saves Pete\n');
    expect(await out('git branch --show-current')).toBe('prime-timeline\n');
  });

  test('bad wolf finds every episode that wrote it', async () => {
    await engine.enter('bad-wolf');
    expect(await out('git log -S "Bad Wolf" --format=%s')).toBe('Doomsday\nThe Parting of the Ways\nBad Wolf\n');
  });

  test('the checked-in git config is never written to', async () => {
    expect(await Bun.file(join(import.meta.dir, '../server/tardis.gitconfig')).text()).not.toContain('alias');
  });
});
