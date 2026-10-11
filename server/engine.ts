import { cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { LiveState, RunResult, Scene, WorkDir } from '../shared/types';
import { buildSnapshot } from './build';
import { tokenize } from './command';
import { git } from './git';
import { readGraph } from './graph';
import { collapseCarriageReturns } from './output';
import { livePath, readWorkDir } from './workdir';

export class Engine {
  private readonly home: string;
  private readonly scenes: Scene[];
  private readonly live: string;
  // enter and run share one live dir; interleaved rm/cp corrupts it.
  private queue: Promise<unknown> = Promise.resolve();

  constructor(home: string, scenes: Scene[]) {
    this.home = home;
    this.scenes = scenes;
    this.live = join(home, 'live');
  }

  private snapshot(id: string) {
    return join(this.home, 'snapshots', id);
  }

  async prepare() {
    for (const scene of this.scenes) await buildSnapshot(this.snapshot(scene.id), scene.build);
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
    return this.serialise(() => this.doRun(input));
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

  private async readLive(): Promise<LiveState> {
    return { graph: await readGraph(this.live), workdir: await readWorkDir(this.live) };
  }

  private async doEnter(id: string): Promise<LiveState> {
    if (!this.scenes.some((s) => s.id === id)) throw new Error(`unknown scene: ${id}`);
    await rm(this.live, { recursive: true, force: true });
    await cp(this.snapshot(id), this.live, { recursive: true });
    return this.readLive();
  }

  private async doRun(input: string): Promise<RunResult> {
    const parsed = tokenize(input);
    const result = parsed.ok ? await git(this.live, parsed.args) : { output: parsed.error, code: 1 };
    return { ...result, output: collapseCarriageReturns(result.output), ...(await this.readLive()) };
  }
}
