import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { EpisodeResult, LiveState, RunResult, Scene, WorkDir } from '../shared/types';
import { buildSnapshot, DAY, ROSE_AIRED } from './build';
import { git } from './git';
import { readGraph } from './graph';
import { collapseCarriageReturns } from './output';
import { meetsExpectation, play } from './play';
import { GITCONFIG, sh } from './shell';
import { livePath, readWorkDir } from './workdir';

export class UnknownEpisodeError extends Error {}
export class InvalidCommitError extends Error {}
export class UnknownCommitError extends Error {}

/** Every repo dir carries its own global git config next to it, so aliases travel with snapshots. */
const configOf = (dir: string) => `${dir}.gitconfig`;

async function copyRepo(from: string, to: string) {
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
  await copyFile(configOf(from), configOf(to));
}

export class Engine {
  private readonly home: string;
  private readonly scenes: Scene[];
  private readonly live: string;
  private current: Scene | undefined;
  // every call shares one live dir; interleaved rm/cp corrupts it.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(home: string, scenes: Scene[]) {
    this.home = resolve(home);
    this.scenes = scenes;
    this.live = join(this.home, 'live');
  }

  private snapshot(id: string) {
    return join(this.home, 'snapshots', id);
  }

  async prepare() {
    const later = this.scenes.slice(1).find((s) => s.build);
    if (later) throw new Error(`only the first scene has a build: ${later.id}`);

    const work = join(this.home, 'work');
    const build = this.scenes[0]?.build ?? [];
    await buildSnapshot(work, build);
    await copyFile(GITCONFIG, configOf(work));
    await mkdir(join(this.home, 'snapshots'), { recursive: true });

    // Replays continue the build's fixed clock, so snapshot hashes are stable.
    let tick = build.length;
    for (const scene of this.scenes) {
      await copyRepo(work, this.snapshot(scene.id));
      for (const [i, step] of scene.steps.entries()) {
        const date = `@${ROSE_AIRED + tick++ * DAY} +0000`;
        const played = await play(work, step, { config: configOf(work), date });
        if (!meetsExpectation(step, played.code))
          throw new Error(`${scene.id} step ${i + 1} (${played.cmd}) exited ${played.code}: ${played.output}`);
      }
    }
  }

  private serialise<T>(task: () => Promise<T>): Promise<T> {
    const result = this.queue.then(task);
    this.queue = result.catch(() => undefined);
    return result;
  }

  enter(id: string): Promise<LiveState> {
    return this.serialise(() => this.doEnter(id));
  }

  run(input: string): Promise<RunResult> {
    return this.serialise(async () =>
      this.withLive(await sh(this.live, input, { config: configOf(this.live), color: true })),
    );
  }

  episode(code: string): Promise<EpisodeResult> {
    return this.serialise(async () => {
      const step = this.current?.steps.find((s) => 'episode' in s && s.episode.code === code);
      if (!step) throw new UnknownEpisodeError(`unknown episode: ${code}`);
      const { cmd, ...result } = await play(this.live, step, { config: configOf(this.live), color: true });
      return { cmd, ...(await this.withLive(result)) };
    });
  }

  /** A merge diffs against its first parent: what it brought into the branch it was merged into. */
  show(hash: string): Promise<string> {
    return this.serialise(async () => {
      if (!/^[0-9a-f]{4,64}$/.test(hash)) throw new InvalidCommitError(`invalid commit: ${hash}`);
      const { output, code } = await git(this.live, ['show', '--format=', '--diff-merges=first-parent', hash]);
      if (code !== 0) throw new UnknownCommitError(`unknown commit: ${hash}`);
      return output;
    });
  }

  readFile(path: string): Promise<string> {
    return this.serialise(async () => Bun.file(await livePath(this.live, path)).text());
  }

  writeFile(path: string, content: string): Promise<WorkDir> {
    return this.serialise(async () => {
      await Bun.write(await livePath(this.live, path), content);
      return readWorkDir(this.live);
    });
  }

  private async withLive(result: { output: string; code: number }): Promise<RunResult> {
    return {
      ...result,
      output: collapseCarriageReturns(result.output),
      graph: await readGraph(this.live),
      workdir: await readWorkDir(this.live),
    };
  }

  private async doEnter(id: string): Promise<LiveState> {
    const scene = this.scenes.find((s) => s.id === id);
    if (!scene) throw new Error(`unknown scene: ${id}`);
    this.current = undefined;
    await copyRepo(this.snapshot(id), this.live);
    this.current = scene;
    return { graph: await readGraph(this.live), workdir: await readWorkDir(this.live) };
  }
}
