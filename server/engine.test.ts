import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { Engine, InvalidCommitError, UnknownCommitError, UnknownEpisodeError } from './engine';
import { GITCONFIG } from './shell';
import { InvalidPathError } from './workdir';

const LOG = 'Doctor: The Ninth Doctor\nLocation: London, 2005\n';
const endOfTheWorld = { code: 'S01E02', title: 'The End of the World', set: { Location: 'Platform One' } };

const rose: Scene = {
  id: 'rose',
  episode: 'S01E01',
  title: 'Rose',
  story: [],
  build: [{ git: ['init', '-q'] }, { commit: 'Rose', files: { 'TARDIS.md': LOG } }],
  steps: [{ cmd: 'git config --global alias.st status', caption: '' }, { episode: endOfTheWorld }],
};
const dalek: Scene = {
  id: 'dalek',
  episode: 'S01E06',
  title: 'Dalek',
  story: [],
  steps: [{ cmd: 'git commit -q --allow-empty -m Dalek', caption: '' }],
};

describe('Engine', () => {
  let engine: Engine;
  beforeAll(async () => {
    engine = new Engine(await tmp(), [rose, dalek]);
    await engine.prepare();
  });

  test('a scene starts where the previous scene ended', async () => {
    const { graph } = await engine.enter('dalek');
    expect(graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
    expect((await engine.run('git st --short')).code).toBe(0);
  });

  test('the first scene starts from its build', async () => {
    expect((await engine.enter('rose')).graph.commits.map((c) => c.message)).toEqual(['Rose']);
    expect((await engine.run('git st')).code).not.toBe(0);
  });

  test('runs any shell line in the live repo', async () => {
    await engine.enter('rose');
    expect(await engine.run('ls | wc -l')).toMatchObject({ code: 0, output: '1\n' });
  });

  test('git config --global writes the live config, never the checked-in one', async () => {
    await engine.enter('rose');
    await engine.run('git config --global alias.regenerate "log --oneline"');
    expect((await engine.run('git regenerate')).code).toBe(0);
    expect(await Bun.file(GITCONFIG).text()).not.toContain('regenerate');
  });

  test('plays an episode of the current scene', async () => {
    await engine.enter('rose');
    const result = await engine.episode('S01E02');
    expect(result).toMatchObject({ cmd: 'git commit -am "The End of the World"', code: 0 });
    expect(result.graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
    expect(await engine.readFile('TARDIS.md')).toBe('Doctor: The Ninth Doctor\nLocation: Platform One\n');
  });

  test('an episode outside the current scene is unknown', async () => {
    await engine.enter('dalek');
    await expect(engine.episode('S01E02')).rejects.toBeInstanceOf(UnknownEpisodeError);
  });

  test('entering a scene and running a command return the working directory', async () => {
    expect((await engine.enter('rose')).workdir.files).toEqual([{ path: 'TARDIS.md', status: 'clean', code: '' }]);
    const result = await engine.run('git rm -q --cached TARDIS.md');
    expect(result.workdir.files).toEqual([{ path: 'TARDIS.md', status: 'untracked', code: '??' }]);
  });

  test('writing a file returns the updated working directory', async () => {
    await engine.enter('rose');
    const workdir = await engine.writeFile('TARDIS.md', '# Bad Wolf\n');
    expect(workdir.files).toEqual([{ path: 'TARDIS.md', status: 'modified', code: ' M' }]);
    expect(await engine.readFile('TARDIS.md')).toBe('# Bad Wolf\n');
  });

  test('writing a new file creates its directories', async () => {
    await engine.enter('rose');
    const workdir = await engine.writeFile('companions/jack.md', 'Jack\n');
    expect(workdir.files).toContainEqual({ path: 'companions/jack.md', status: 'untracked', code: '??' });
  });

  test('shows the diff a commit made', async () => {
    await engine.enter('rose');
    await engine.episode('S01E02');
    const head = (await engine.run('git rev-parse HEAD')).output.trim();
    const diff = await engine.show(head);
    expect(diff).toContain('-Location: London, 2005\n+Location: Platform One\n');
    expect(diff).not.toContain('The End of the World');
  });

  test('shows a merge as the diff against its first parent', async () => {
    await engine.enter('rose');
    await engine.run(
      'git switch -q -c side && echo Dalek > dalek.md && git add dalek.md && git commit -qm Dalek && git switch -q - && git merge -q --no-ff -m Merge side',
    );
    const head = (await engine.run('git rev-parse HEAD')).output.trim();
    expect(await engine.show(head)).toContain('+++ b/dalek.md\n@@ -0,0 +1 @@\n+Dalek\n');
  });

  test('rejects a malformed or unknown commit', async () => {
    await engine.enter('rose');
    await expect(engine.show('HEAD; rm -rf /')).rejects.toBeInstanceOf(InvalidCommitError);
    await expect(engine.show('--output=x')).rejects.toBeInstanceOf(InvalidCommitError);
    await expect(engine.show('deadbeef')).rejects.toBeInstanceOf(UnknownCommitError);
  });

  test('rejects paths outside the live dir', async () => {
    await expect(engine.readFile('../snapshots/rose/TARDIS.md')).rejects.toBeInstanceOf(InvalidPathError);
    await expect(engine.writeFile('.git/HEAD', 'x')).rejects.toBeInstanceOf(InvalidPathError);
  });

  test('re-entering a scene resets it, config included', async () => {
    await engine.enter('rose');
    await engine.run('git commit --allow-empty -m "Changed"');
    await engine.run('git config --global alias.st status');
    expect((await engine.enter('rose')).graph.commits).toHaveLength(1);
    expect((await engine.run('git st')).code).not.toBe(0);
  });

  test('entering an unknown scene throws and keeps the current live repo', async () => {
    await engine.enter('dalek');
    await expect(engine.enter('nope')).rejects.toThrow('unknown scene: nope');
    expect((await engine.run('git log --format=%s')).output).toBe('The End of the World\nRose\n');
  });

  test('concurrent enters are serialised and the live repo matches the last one', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 'rose' : 'dalek'));
    const graphs = await Promise.all(ids.map((id) => engine.enter(id)));
    expect(graphs.map((g) => g.graph.commits.length)).toEqual(ids.map((id) => (id === 'rose' ? 1 : 2)));
    expect((await engine.run('git log --format=%s')).output).toBe('The End of the World\nRose\n');
  });

  test('a failed call does not poison the queue', async () => {
    const [bad, good] = await Promise.allSettled([engine.enter('nope'), engine.enter('rose')]);
    expect(bad.status).toBe('rejected');
    expect(good.status).toBe('fulfilled');
  });
});

describe('Engine.prepare', () => {
  test('fails loudly when a step does not exit as expected', async () => {
    const broken: Scene = { ...rose, steps: [{ cmd: 'git checkout nowhere', caption: '' }] };
    await expect(new Engine(await tmp(), [broken]).prepare()).rejects.toThrow('rose step 1 (git checkout nowhere)');
  });

  test('only the first scene may have a build', async () => {
    await expect(new Engine(await tmp(), [rose, { ...dalek, build: [] }]).prepare()).rejects.toThrow(
      'only the first scene has a build: dalek',
    );
  });

  test('snapshots have stable hashes', async () => {
    const [a, b] = [await tmp(), await tmp()];
    await new Engine(a, [rose, dalek]).prepare();
    await new Engine(b, [rose, dalek]).prepare();
    const head = (home: string) => Bun.file(join(home, 'snapshots/dalek/.git/refs/heads/prime-timeline')).text();
    expect(await head(a)).toBe(await head(b));
  });
});
