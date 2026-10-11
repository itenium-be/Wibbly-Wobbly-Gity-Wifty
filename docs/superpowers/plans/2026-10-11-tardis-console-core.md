# TARDIS Console Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working TARDIS console end-to-end — story cards, live git, flat 2D timeline — with the first two scenes (Rose, Fixed Points).

**Architecture:** One Bun process serves the React frontend (Bun HTML imports, no Vite) and a small JSON API. The API runs real `git` in a throwaway live repo under the OS temp dir; each scene's starting state is a snapshot built deterministically at startup and copied into the live repo on enter/reset. The frontend renders a JSON graph model through a swappable renderer (flat SVG lanes in v1).

**Tech Stack:** Bun 1.3, TypeScript, React 19, `bun test` + happy-dom + Testing Library, Biome.

**Spec:** `docs/superpowers/specs/2026-10-11-tardis-console-design.md`

**Scope:** Plan 1 of 2. Plan 2 adds the remaining eight scenes, reflog in the graph model and merge-aware lanes.

---

## File Structure

| Path                              | Responsibility                                                      |
|-----------------------------------|---------------------------------------------------------------------|
| `shared/types.ts`                 | Types shared by server, scenes and web                              |
| `server/tardis.gitconfig`         | Git identity/defaults for every timeline repo                       |
| `server/git.ts`                   | Run `git` with an isolated environment                              |
| `server/command.ts`               | Parse the presenter's input into git args (git only)                |
| `server/build.ts`                 | Build a scene snapshot from `GitStep[]`, deterministic hashes       |
| `server/graph.ts`                 | Read a repo into `GraphModel`                                       |
| `server/engine.ts`                | Snapshots + live repo: prepare, enter, run                          |
| `server/api.ts`                   | HTTP route handlers                                                 |
| `server/index.ts`                 | Bun.serve entry: frontend, assets, API                              |
| `scenes/rose.ts`                  | Scene: Rose (cold open + first commit)                              |
| `scenes/fixed-points.ts`          | Scene: Fixed Points (tag, detached HEAD)                            |
| `scenes/index.ts`                 | Scene order                                                         |
| `web/index.html`, `web/main.tsx`  | Frontend entry                                                      |
| `web/api.ts`                      | Fetch wrappers                                                      |
| `web/cue.ts`                      | Ghost-text cue + cue advancing                                      |
| `web/nav.ts`                      | Story card / scene navigation                                       |
| `web/graph/layout.ts`             | `GraphModel` → lanes, nodes, edges, HEAD (renderer-agnostic)        |
| `web/graph/Tardis.tsx`            | TARDIS SVG                                                          |
| `web/graph/FlatTimeline.tsx`      | 2D lane renderer                                                    |
| `web/story/StoryCardView.tsx`     | Full-screen story card with rotating images                         |
| `web/console/Console.tsx`         | Command input with ghost cue, caption, output                       |
| `web/App.tsx`                     | State, keys, phase switching                                        |
| `web/styles.css`                  | All styling                                                         |
| `assets/`                         | BBC stills (committed)                                              |
| `test/dom.ts`, `test/cleanup.ts`  | Test preloads                                                       |
| `test/tmp.ts`                     | Temp dir helper                                                     |

---

### Task 1: Project setup

**Files:**
- Create: `package.json`, `tsconfig.json`, `biome.json`, `bunfig.toml`, `.gitignore`, `test/dom.ts`, `test/cleanup.ts`, `test/tmp.ts`, `test/setup.test.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tardis-console",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --hot server/index.ts",
    "test": "bun test",
    "lint": "biome check .",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Install dependencies** (ask Wouter before running — adds deps)

```bash
bun add react react-dom
bun add -d typescript @types/bun @types/react @types/react-dom @biomejs/biome @happy-dom/global-registrator @testing-library/react @testing-library/dom
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "types": ["bun"]
  },
  "include": ["server", "shared", "scenes", "web", "test"]
}
```

- [ ] **Step 4: Create `biome.json`**

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "formatter": { "indentStyle": "space", "indentWidth": 2, "lineWidth": 120 },
  "javascript": { "formatter": { "quoteStyle": "single" } },
  "linter": { "enabled": true, "rules": { "recommended": true } }
}
```

If `bunx biome check .` rejects a key (schema differs between Biome majors), run `bunx biome migrate --write` and re-check.

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 6: Create test preloads**

`bunfig.toml`:
```toml
[test]
preload = ["./test/dom.ts", "./test/cleanup.ts"]
```

`test/dom.ts`:
```ts
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Server handlers are tested with Bun's native Request/Response; happy-dom would replace them.
const { Request, Response, Headers, fetch } = globalThis;
GlobalRegistrator.register();
Object.assign(globalThis, { Request, Response, Headers, fetch });
```

`test/cleanup.ts`:
```ts
import { afterEach } from 'bun:test';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);
```

`test/tmp.ts`:
```ts
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const tmp = () => mkdtemp(join(tmpdir(), 'tardis-test-'));
```

- [ ] **Step 7: Write the setup test**

`test/setup.test.ts`:
```ts
import { expect, test } from 'bun:test';

test('dom and native fetch primitives are both available', () => {
  expect(document.createElement('div').tagName).toBe('DIV');
  expect(typeof Response.json).toBe('function');
});
```

- [ ] **Step 8: Run tests, lint, typecheck**

Run: `bun test && bun run lint && bun run typecheck`
Expected: `1 pass, 0 fail`; Biome reports no errors/warnings; tsc exits 0.

- [ ] **Step 9: Commit**

```bash
git add package.json bun.lock tsconfig.json biome.json bunfig.toml .gitignore test/
git commit -m "Set up Bun, React, Biome and test tooling"
```

---

### Task 2: Shared types and git runner

**Files:**
- Create: `shared/types.ts`, `server/tardis.gitconfig`, `server/git.ts`
- Test: `server/git.test.ts`

- [ ] **Step 1: Create `shared/types.ts`**

```ts
export type StoryImage = { src: string; name?: string; fate?: string };
export type StoryCard = { title: string; text: string; images: StoryImage[] };
export type Step = { cmd: string; caption: string };

export type GitStep =
  | { write: Record<string, string> }
  | { git: string[] }
  | { commit: string; files?: Record<string, string> };

export type Scene = {
  id: string;
  episode: string;
  title: string;
  story: StoryCard[];
  build: GitStep[];
  steps: Step[];
};
export type SceneView = Omit<Scene, 'build'>;

export type Commit = { hash: string; short: string; message: string; parents: string[] };
export type Ref = { name: string; hash: string };
export type GraphModel = {
  initialized: boolean;
  commits: Commit[];
  branches: Ref[];
  tags: Ref[];
  head: { hash: string | null; branch: string | null };
};
export type RunResult = { output: string; code: number; graph: GraphModel };
```

- [ ] **Step 2: Create `server/tardis.gitconfig`**

```
[user]
	name = The Doctor
	email = doctor@tardis.gallifrey
[init]
	defaultBranch = prime-timeline
[commit]
	gpgsign = false
[core]
	autocrlf = false
	pager = cat
[color]
	ui = false
```

- [ ] **Step 3: Write the failing tests**

`server/git.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { git } from './git';

describe('git', () => {
  test('uses the TARDIS identity, not the presenter identity', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    const { output } = await git(dir, ['config', 'user.name']);
    expect(output.trim()).toBe('The Doctor');
  });

  test('initialises repos on prime-timeline', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    const { output } = await git(dir, ['symbolic-ref', '--short', 'HEAD']);
    expect(output.trim()).toBe('prime-timeline');
  });

  test('does not resolve an enclosing repo', async () => {
    const outer = await tmp();
    await git(outer, ['init', '-q']);
    const inner = join(outer, 'live');
    await mkdir(inner);
    const { code } = await git(inner, ['rev-parse', '--git-dir']);
    expect(code).not.toBe(0);
  });

  test('applies a fixed date', async () => {
    const dir = await tmp();
    await git(dir, ['init', '-q']);
    await git(dir, ['commit', '-q', '--allow-empty', '-m', 'Rose'], '@1111863600 +0000');
    const { output } = await git(dir, ['log', '-1', '--format=%at']);
    expect(output.trim()).toBe('1111863600');
  });

  test('returns the exit code and stderr of a failing command', async () => {
    const dir = await tmp();
    const { code, output } = await git(dir, ['log']);
    expect(code).not.toBe(0);
    expect(output).toContain('not a git repository');
  });
});
```

- [ ] **Step 4: Run to verify they fail**

Run: `bun test server/git.test.ts`
Expected: FAIL — `Cannot find module './git'`.

- [ ] **Step 5: Implement `server/git.ts`**

```ts
import { dirname, join } from 'node:path';

const GITCONFIG = join(import.meta.dir, 'tardis.gitconfig');

export type GitResult = { output: string; code: number };

export async function git(cwd: string, args: string[], date?: string): Promise<GitResult> {
  const env: Record<string, string> = {
    PATH: process.env.PATH ?? '',
    HOME: process.env.HOME ?? '',
    LANG: 'C',
    // The presenter's own git config must not leak into the timeline.
    GIT_CONFIG_GLOBAL: GITCONFIG,
    GIT_CONFIG_NOSYSTEM: '1',
    // Before `git init`, the live dir must not resolve to an enclosing repo.
    GIT_CEILING_DIRECTORIES: dirname(cwd),
    GIT_EDITOR: 'true',
    GIT_TERMINAL_PROMPT: '0',
  };
  if (date) Object.assign(env, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });

  const proc = Bun.spawn(['git', ...args], { cwd, env, stdout: 'pipe', stderr: 'pipe', timeout: 10_000 });
  const [stdout, stderr, code] = await Promise.all([
    Bun.readableStreamToText(proc.stdout),
    Bun.readableStreamToText(proc.stderr),
    proc.exited,
  ]);
  return { output: stdout + stderr, code };
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `bun test server/git.test.ts`
Expected: `5 pass, 0 fail`.

- [ ] **Step 7: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add shared/types.ts server/tardis.gitconfig server/git.ts server/git.test.ts
git commit -m "Add isolated git runner"
```

---

### Task 3: Command parsing

**Files:**
- Create: `server/command.ts`
- Test: `server/command.test.ts`

- [ ] **Step 1: Write the failing tests**

`server/command.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { tokenize } from './command';

describe('tokenize', () => {
  test('splits a plain git command', () => {
    expect(tokenize('git log --oneline')).toEqual({ ok: true, args: ['log', '--oneline'] });
  });

  test('keeps double-quoted text as one argument', () => {
    expect(tokenize('git commit -m "Father\'s Day"')).toEqual({ ok: true, args: ['commit', '-m', "Father's Day"] });
  });

  test('keeps single-quoted text as one argument', () => {
    expect(tokenize("git commit -m 'Bad Wolf'")).toEqual({ ok: true, args: ['commit', '-m', 'Bad Wolf'] });
  });

  test('keeps an empty quoted argument', () => {
    expect(tokenize('git commit -m ""')).toEqual({ ok: true, args: ['commit', '-m', ''] });
  });

  test('collapses surrounding and repeated whitespace', () => {
    expect(tokenize('  git   status  ')).toEqual({ ok: true, args: ['status'] });
  });

  test('rejects an unterminated quote', () => {
    expect(tokenize('git commit -m "Rose')).toEqual({ ok: false, error: 'unterminated "' });
  });

  test('rejects anything but git', () => {
    expect(tokenize('rm -rf /')).toEqual({ ok: false, error: 'only git commands travel in this TARDIS' });
    expect(tokenize('')).toEqual({ ok: false, error: 'only git commands travel in this TARDIS' });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test server/command.test.ts`
Expected: FAIL — `Cannot find module './command'`.

- [ ] **Step 3: Implement `server/command.ts`**

```ts
export type Parsed = { ok: true; args: string[] } | { ok: false; error: string };

export function tokenize(input: string): Parsed {
  const tokens: string[] = [];
  let current = '';
  let inToken = false;
  let quote: string | null = null;

  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
    } else if (/\s/.test(ch)) {
      if (inToken) tokens.push(current);
      current = '';
      inToken = false;
    } else {
      current += ch;
      inToken = true;
    }
  }

  if (quote) return { ok: false, error: `unterminated ${quote}` };
  if (inToken) tokens.push(current);
  if (tokens[0] !== 'git') return { ok: false, error: 'only git commands travel in this TARDIS' };
  return { ok: true, args: tokens.slice(1) };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test server/command.test.ts`
Expected: `7 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add server/command.ts server/command.test.ts
git commit -m "Parse presenter input into git arguments"
```

---

### Task 4: Snapshot builder

**Files:**
- Create: `server/build.ts`
- Test: `server/build.test.ts`

- [ ] **Step 1: Write the failing tests**

`server/build.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { git } from './git';

const timeline = [{ git: ['init', '-q'] }, { commit: 'Rose' }, { commit: 'Dalek' }];

describe('buildSnapshot', () => {
  test('replays commits in order', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, timeline);
    const { output } = await git(dir, ['log', '--format=%s']);
    expect(output.trim().split('\n')).toEqual(['Dalek', 'Rose']);
  });

  test('produces identical hashes on every build', async () => {
    const [a, b] = [await tmp(), await tmp()];
    await buildSnapshot(a, timeline);
    await buildSnapshot(b, timeline);
    const [ha, hb] = [await git(a, ['rev-parse', 'HEAD']), await git(b, ['rev-parse', 'HEAD'])];
    expect(ha.output).toBe(hb.output);
  });

  test('writes files without needing a repo', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ write: { 'episodes/rose.md': '# Rose\n' } }]);
    expect(await readFile(join(dir, 'episodes/rose.md'), 'utf8')).toBe('# Rose\n');
    expect((await git(dir, ['rev-parse', '--git-dir'])).code).not.toBe(0);
  });

  test('commits the given files instead of the default episode file', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ git: ['init', '-q'] }, { commit: 'Blink', files: { 'angels.txt': "Don't blink\n" } }]);
    const { output } = await git(dir, ['show', '--name-only', '--format=', 'HEAD']);
    expect(output.trim()).toBe('angels.txt');
  });

  test('throws when a git step fails', async () => {
    const dir = await tmp();
    await expect(buildSnapshot(dir, [{ git: ['init', '-q'] }, { git: ['checkout', 'nowhere'] }])).rejects.toThrow(
      'git checkout nowhere failed',
    );
  });

  test('wipes the previous build', async () => {
    const dir = await tmp();
    await buildSnapshot(dir, [{ write: { 'a.txt': 'a' } }]);
    await buildSnapshot(dir, []);
    expect(await Bun.file(join(dir, 'a.txt')).exists()).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test server/build.test.ts`
Expected: FAIL — `Cannot find module './build'`.

- [ ] **Step 3: Implement `server/build.ts`**

```ts
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GitStep } from '../shared/types';
import { git } from './git';

const ROSE_AIRED = 1111863600; // 2005-03-26 19:00 GMT
const DAY = 86400;

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
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test server/build.test.ts`
Expected: `6 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add server/build.ts server/build.test.ts
git commit -m "Build deterministic scene snapshots"
```

---

### Task 5: Graph model

**Files:**
- Create: `server/graph.ts`
- Test: `server/graph.test.ts`

- [ ] **Step 1: Write the failing tests**

`server/graph.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import type { GitStep } from '../shared/types';
import { tmp } from '../test/tmp';
import { buildSnapshot } from './build';
import { readGraph } from './graph';

async function repo(steps: GitStep[]) {
  const dir = await tmp();
  await buildSnapshot(dir, steps);
  return readGraph(dir);
}

describe('readGraph', () => {
  test('a plain directory is not initialized', async () => {
    expect(await repo([])).toEqual({
      initialized: false,
      commits: [],
      branches: [],
      tags: [],
      head: { hash: null, branch: null },
    });
  });

  test('an empty repo sits on prime-timeline with no commits', async () => {
    const g = await repo([{ git: ['init', '-q'] }]);
    expect(g.initialized).toBe(true);
    expect(g.commits).toEqual([]);
    expect(g.head).toEqual({ hash: null, branch: 'prime-timeline' });
  });

  test('reads commits oldest first with parents, branches, tags and HEAD', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { commit: 'Dalek' },
      { git: ['tag', 'fixed-point', 'HEAD~1'] },
      { git: ['branch', 'petes-world'] },
    ]);
    const [rose, dalek] = g.commits;
    expect(g.commits.map((c) => c.message)).toEqual(['Rose', 'Dalek']);
    expect(rose.parents).toEqual([]);
    expect(dalek.parents).toEqual([rose.hash]);
    expect(dalek.hash.startsWith(dalek.short)).toBe(true);
    expect(g.branches).toEqual([
      { name: 'petes-world', hash: dalek.hash },
      { name: 'prime-timeline', hash: dalek.hash },
    ]);
    expect(g.tags).toEqual([{ name: 'fixed-point', hash: rose.hash }]);
    expect(g.head).toEqual({ hash: dalek.hash, branch: 'prime-timeline' });
  });

  test('an annotated tag points at its commit', async () => {
    const g = await repo([{ git: ['init', '-q'] }, { commit: 'Rose' }, { git: ['tag', '-a', '-m', 'fixed', 'pompeii'] }]);
    expect(g.tags).toEqual([{ name: 'pompeii', hash: g.commits[0].hash }]);
  });

  test('a detached HEAD has a hash but no branch', async () => {
    const g = await repo([
      { git: ['init', '-q'] },
      { commit: 'Rose' },
      { commit: 'Dalek' },
      { git: ['checkout', '-q', 'HEAD~1'] },
    ]);
    expect(g.head).toEqual({ hash: g.commits[0].hash, branch: null });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test server/graph.test.ts`
Expected: FAIL — `Cannot find module './graph'`.

- [ ] **Step 3: Implement `server/graph.ts`**

```ts
import type { Commit, GraphModel, Ref } from '../shared/types';
import { git } from './git';

const SEP = '\x1f';

async function lines(cwd: string, args: string[]) {
  const { output, code } = await git(cwd, args);
  return code === 0 ? output.split('\n').filter(Boolean) : [];
}

async function refs(cwd: string, namespace: string): Promise<Ref[]> {
  const rows = await lines(cwd, ['for-each-ref', '--format=%(refname:lstrip=2)%1f%(objectname)%1f%(*objectname)', namespace]);
  return rows.map((row) => {
    const [name, hash, peeled] = row.split(SEP);
    return { name, hash: peeled || hash };
  });
}

export async function readGraph(cwd: string): Promise<GraphModel> {
  if ((await git(cwd, ['rev-parse', '--git-dir'])).code !== 0) {
    return { initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } };
  }

  const commits: Commit[] = (
    await lines(cwd, ['log', '--all', '--topo-order', '--reverse', '--format=%H%x1f%h%x1f%P%x1f%s'])
  ).map((row) => {
    const [hash, short, parents, message] = row.split(SEP);
    return { hash, short, message, parents: parents ? parents.split(' ') : [] };
  });

  const branch = await git(cwd, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const hash = await git(cwd, ['rev-parse', '-q', '--verify', 'HEAD']);

  return {
    initialized: true,
    commits,
    branches: await refs(cwd, 'refs/heads'),
    tags: await refs(cwd, 'refs/tags'),
    head: {
      hash: hash.code === 0 ? hash.output.trim() : null,
      branch: branch.code === 0 ? branch.output.trim() : null,
    },
  };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test server/graph.test.ts`
Expected: `5 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add server/graph.ts server/graph.test.ts
git commit -m "Read a repo into the graph model"
```

---

### Task 6: Engine

**Files:**
- Create: `server/engine.ts`
- Test: `server/engine.test.ts`

- [ ] **Step 1: Write the failing tests**

`server/engine.test.ts`:
```ts
import { beforeAll, describe, expect, test } from 'bun:test';
import type { Scene } from '../shared/types';
import { tmp } from '../test/tmp';
import { Engine } from './engine';

const scene = (id: string, commits: string[]): Scene => ({
  id,
  episode: 'S01E01',
  title: id,
  story: [],
  build: [{ git: ['init', '-q'] }, ...commits.map((commit) => ({ commit }))],
  steps: [],
});

describe('Engine', () => {
  let engine: Engine;
  beforeAll(async () => {
    engine = new Engine(await tmp(), [scene('rose', ['Rose']), scene('dalek', ['Rose', 'Dalek'])]);
    await engine.prepare();
  });

  test('entering a scene loads its snapshot', async () => {
    expect((await engine.enter('dalek')).commits.map((c) => c.message)).toEqual(['Rose', 'Dalek']);
  });

  test('runs git in the live repo and returns the new graph', async () => {
    await engine.enter('rose');
    const result = await engine.run('git commit --allow-empty -m "The End of the World"');
    expect(result.code).toBe(0);
    expect(result.graph.commits.map((c) => c.message)).toEqual(['Rose', 'The End of the World']);
  });

  test('re-entering a scene resets it', async () => {
    await engine.enter('rose');
    await engine.run('git commit --allow-empty -m "Changed"');
    expect((await engine.enter('rose')).commits).toHaveLength(1);
  });

  test('rejects non-git input without running it', async () => {
    await engine.enter('rose');
    const result = await engine.run('ls');
    expect(result).toMatchObject({ code: 1, output: 'only git commands travel in this TARDIS' });
    expect(result.graph.commits).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test server/engine.test.ts`
Expected: FAIL — `Cannot find module './engine'`.

- [ ] **Step 3: Implement `server/engine.ts`**

```ts
import { cp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { GraphModel, RunResult, Scene } from '../shared/types';
import { buildSnapshot } from './build';
import { tokenize } from './command';
import { git } from './git';
import { readGraph } from './graph';

export class Engine {
  private readonly home: string;
  private readonly scenes: Scene[];
  private readonly live: string;

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

  async enter(id: string): Promise<GraphModel> {
    await rm(this.live, { recursive: true, force: true });
    await cp(this.snapshot(id), this.live, { recursive: true });
    return readGraph(this.live);
  }

  async run(input: string): Promise<RunResult> {
    const parsed = tokenize(input);
    const result = parsed.ok ? await git(this.live, parsed.args) : { output: parsed.error, code: 1 };
    return { ...result, graph: await readGraph(this.live) };
  }
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test server/engine.test.ts`
Expected: `4 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add server/engine.ts server/engine.test.ts
git commit -m "Add engine for snapshots and the live repo"
```

---

### Task 7: Scenes — Rose and Fixed Points

**Files:**
- Create: `scenes/rose.ts`, `scenes/fixed-points.ts`, `scenes/index.ts`
- Test: `scenes/scenes.test.ts`

- [ ] **Step 1: Write the failing tests**

`scenes/scenes.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { buildSnapshot } from '../server/build';
import { tokenize } from '../server/command';
import { git } from '../server/git';
import { tmp } from '../test/tmp';
import { scenes } from '.';

async function replay(dir: string, cmds: string[]) {
  for (const cmd of cmds) {
    const parsed = tokenize(cmd);
    if (!parsed.ok) throw new Error(parsed.error);
    const { code, output } = await git(dir, parsed.args);
    expect({ cmd, code, output }).toMatchObject({ code: 0 });
  }
}

describe('scenes', () => {
  test('ids are unique', () => {
    expect(new Set(scenes.map((s) => s.id)).size).toBe(scenes.length);
  });

  for (const scene of scenes) {
    test(`${scene.id}: every cue runs cleanly against its snapshot`, async () => {
      const dir = await tmp();
      await buildSnapshot(dir, scene.build);
      await replay(
        dir,
        scene.steps.map((s) => s.cmd),
      );
    });
  }

  test('fixed-points: the tag lands on The Fires of Pompeii', async () => {
    const scene = scenes.find((s) => s.id === 'fixed-points');
    if (!scene) throw new Error('fixed-points scene missing');
    const dir = await tmp();
    await buildSnapshot(dir, scene.build);
    await replay(dir, ['git tag fixed-point/pompeii HEAD~2']);
    const { output } = await git(dir, ['log', '-1', '--format=%s', 'fixed-point/pompeii']);
    expect(output.trim()).toBe('The Fires of Pompeii');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test scenes/`
Expected: FAIL — `Cannot find module '.'`.

- [ ] **Step 3: Create `scenes/rose.ts`**

```ts
import type { Scene } from '../shared/types';

export const rose: Scene = {
  id: 'rose',
  episode: 'S01E01',
  title: 'Rose',
  story: [
    {
      title: 'The Doctor',
      text: 'This is the Doctor. He travels through time on fun adventures, where he lets his companions do the dirty work so he can keep his hands clean and his conscience clear.',
      images: [
        { src: '/assets/doctors/09-eccleston.jpg', name: 'The Ninth Doctor' },
        { src: '/assets/doctors/10-tennant.jpg', name: 'The Tenth Doctor' },
        { src: '/assets/doctors/11-smith.jpg', name: 'The Eleventh Doctor' },
        { src: '/assets/doctors/12-capaldi.jpg', name: 'The Twelfth Doctor' },
        { src: '/assets/doctors/13-whittaker.jpg', name: 'The Thirteenth Doctor' },
        { src: '/assets/doctors/14-tennant.jpg', name: 'The Fourteenth Doctor' },
        { src: '/assets/doctors/15-gatwa.jpg', name: 'The Fifteenth Doctor' },
      ],
    },
    {
      title: 'The TARDIS',
      text: 'This is the TARDIS, his time machine. Wherever it lands is where we are in the timeline.',
      images: [{ src: '/assets/tardis.jpg' }],
    },
    {
      title: 'The Companions',
      text: 'These are the companions of the Doctor. They travel with him on his adventures, until they get themselves killed (or worse).',
      images: [
        { src: '/assets/companions/rose.jpg', name: 'Rose Tyler', fate: 'TRAPPED IN A PARALLEL UNIVERSE' },
        { src: '/assets/companions/donna.jpg', name: 'Donna Noble', fate: 'MEMORY WIPED' },
        { src: '/assets/companions/amy-rory.jpg', name: 'Amy & Rory', fate: 'ZAPPED INTO 1938 BY A WEEPING ANGEL' },
        { src: '/assets/companions/clara.jpg', name: 'Clara Oswald', fate: 'DEAD (EVENTUALLY)' },
        { src: '/assets/companions/bill.jpg', name: 'Bill Potts', fate: 'CONVERTED INTO A CYBERMAN' },
        { src: '/assets/companions/river.jpg', name: 'River Song', fate: 'UPLOADED INTO A LIBRARY COMPUTER' },
      ],
    },
    {
      title: 'Rose',
      text: 'Series 1, episode 1: Rose Tyler meets the Doctor. The first event in our timeline, so: the first commit.',
      images: [{ src: '/assets/episodes/rose.jpg' }],
    },
  ],
  build: [{ write: { 'episodes/rose.md': '# Rose\n' } }],
  steps: [
    { cmd: 'git init', caption: 'Every timeline has to start somewhere' },
    { cmd: 'git add .', caption: 'Stage the episode' },
    { cmd: 'git commit -m "Rose"', caption: 'S01E01: the first event in the timeline' },
    { cmd: 'git log', caption: 'HEAD: where the TARDIS is right now' },
  ],
};
```

- [ ] **Step 4: Create `scenes/fixed-points.ts`**

```ts
import type { Scene } from '../shared/types';

const episodes = [
  'Rose',
  'Dalek',
  "Father's Day",
  'The Empty Child',
  'Doomsday',
  'Smith and Jones',
  'Blink',
  'Partners in Crime',
  'The Fires of Pompeii',
  'Planet of the Ood',
  'The Sontaran Stratagem',
];

export const fixedPoints: Scene = {
  id: 'fixed-points',
  episode: 'S04E02',
  title: 'The Fires of Pompeii',
  story: [
    {
      title: 'Fixed Points in Time',
      text: 'Some events are fixed: Pompeii must burn. The Doctor can visit, look around and leave, but he cannot change them. In git, that is a tag.',
      images: [{ src: '/assets/episodes/pompeii.jpg' }],
    },
  ],
  build: [{ git: ['init', '-q'] }, ...episodes.map((commit) => ({ commit }))],
  steps: [
    { cmd: 'git log --oneline', caption: 'The timeline so far: one event per episode' },
    { cmd: 'git tag fixed-point/pompeii HEAD~2', caption: 'Pompeii must burn: mark it as a fixed point' },
    { cmd: 'git checkout fixed-point/pompeii', caption: 'Travel back. Look around, but you are on no timeline: detached HEAD' },
    { cmd: 'git switch prime-timeline', caption: 'Back to the present' },
  ],
};
```

- [ ] **Step 5: Create `scenes/index.ts`**

```ts
import type { Scene } from '../shared/types';
import { fixedPoints } from './fixed-points';
import { rose } from './rose';

export const scenes: Scene[] = [rose, fixedPoints];
```

- [ ] **Step 6: Run to verify they pass**

Run: `bun test scenes/`
Expected: `4 pass, 0 fail`.

- [ ] **Step 7: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add scenes/
git commit -m "Add Rose and Fixed Points scenes"
```

---

### Task 8: API and server entry

**Files:**
- Create: `server/api.ts`, `server/index.ts`, `web/index.html` (stub, replaced in Task 14)
- Test: `server/api.test.ts`

- [ ] **Step 1: Write the failing tests**

`server/api.test.ts`:
```ts
import { beforeAll, describe, expect, test } from 'bun:test';
import type { GraphModel, RunResult, Scene, SceneView } from '../shared/types';
import { tmp } from '../test/tmp';
import { createRoutes } from './api';
import { Engine } from './engine';

const scenes: Scene[] = [
  {
    id: 'rose',
    episode: 'S01E01',
    title: 'Rose',
    story: [],
    build: [{ git: ['init', '-q'] }, { commit: 'Rose' }],
    steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }],
  },
];

const post = (path: string, body?: unknown, params: Record<string, string> = {}) =>
  Object.assign(
    new Request(`http://tardis${path}`, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
    { params },
  );

describe('api', () => {
  let routes: ReturnType<typeof createRoutes>;
  beforeAll(async () => {
    const engine = new Engine(await tmp(), scenes);
    await engine.prepare();
    routes = createRoutes(engine, scenes);
  });

  test('lists scenes without their build script', async () => {
    const body = (await routes['/api/scenes'].GET().json()) as SceneView[];
    expect(body).toEqual([
      { id: 'rose', episode: 'S01E01', title: 'Rose', story: [], steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }] },
    ]);
  });

  test('entering a scene returns its graph', async () => {
    const res = await routes['/api/scenes/:id/enter'].POST(post('/api/scenes/rose/enter', undefined, { id: 'rose' }));
    expect(((await res.json()) as GraphModel).commits.map((c) => c.message)).toEqual(['Rose']);
  });

  test('entering an unknown scene is a 404', async () => {
    const res = await routes['/api/scenes/:id/enter'].POST(post('/api/scenes/nope/enter', undefined, { id: 'nope' }));
    expect(res.status).toBe(404);
  });

  test('runs a command', async () => {
    await routes['/api/scenes/:id/enter'].POST(post('/api/scenes/rose/enter', undefined, { id: 'rose' }));
    const res = await routes['/api/run'].POST(post('/api/run', { input: 'git log --format=%s' }));
    expect((await res.json()) as RunResult).toMatchObject({ code: 0, output: 'Rose\n' });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test server/api.test.ts`
Expected: FAIL — `Cannot find module './api'`.

- [ ] **Step 3: Implement `server/api.ts`**

```ts
import type { Scene, SceneView } from '../shared/types';
import type { Engine } from './engine';

type RouteRequest = Request & { params: Record<string, string> };

const toView = (s: Scene): SceneView => ({ id: s.id, episode: s.episode, title: s.title, story: s.story, steps: s.steps });

export function createRoutes(engine: Engine, scenes: Scene[]) {
  return {
    '/api/scenes': {
      GET: () => Response.json(scenes.map(toView)),
    },
    '/api/scenes/:id/enter': {
      POST: async (req: RouteRequest) => {
        if (!scenes.some((s) => s.id === req.params.id)) return new Response('unknown scene', { status: 404 });
        return Response.json(await engine.enter(req.params.id));
      },
    },
    '/api/run': {
      POST: async (req: Request) => {
        const { input } = (await req.json()) as { input: string };
        return Response.json(await engine.run(input));
      },
    },
  };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test server/api.test.ts`
Expected: `4 pass, 0 fail`.

- [ ] **Step 5: Create stub `web/index.html`** (so the server entry typechecks; replaced in Task 14)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>TARDIS Console</title>
  </head>
  <body></body>
</html>
```

- [ ] **Step 6: Create `server/index.ts`**

```ts
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scenes } from '../scenes';
import index from '../web/index.html';
import { createRoutes } from './api';
import { Engine } from './engine';

const root = join(import.meta.dir, '..');
const engine = new Engine(process.env.TARDIS_HOME ?? join(tmpdir(), 'tardis'), scenes);
await engine.prepare();

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: { hmr: true, console: true },
  routes: {
    '/': index,
    '/assets/*': async (req) => {
      const file = Bun.file(join(root, new URL(req.url).pathname));
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
    },
    ...createRoutes(engine, scenes),
  },
});

console.log(`TARDIS console: ${server.url}`);
```

- [ ] **Step 7: Smoke-test the API**

Run: `bun run dev` (background), then:
```bash
curl -s localhost:3000/api/scenes | head -c 200
curl -s -X POST localhost:3000/api/scenes/fixed-points/enter | head -c 200
curl -s -X POST localhost:3000/api/run -d '{"input":"git log --oneline"}'
```
Expected: scene JSON starting `[{"id":"rose"`; graph JSON with `"initialized":true`; run result whose `output` lists 11 episodes, newest `The Sontaran Stratagem` first. Stop the server.

- [ ] **Step 8: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add server/api.ts server/api.test.ts server/index.ts web/index.html
git commit -m "Serve the scene and git API"
```

---

### Task 9: Cue and navigation logic

**Files:**
- Create: `web/cue.ts`, `web/nav.ts`
- Test: `web/cue.test.ts`, `web/nav.test.ts`

- [ ] **Step 1: Write the failing tests**

`web/cue.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { advance, ghost } from './cue';

describe('ghost', () => {
  test('shows the whole cue when nothing is typed', () => {
    expect(ghost('', 'git log')).toBe('git log');
  });
  test('shows the rest of the cue while the typed text matches', () => {
    expect(ghost('git rebase prime-t', 'git rebase prime-timeline')).toBe('imeline');
  });
  test('shows nothing once the typed text diverges', () => {
    expect(ghost('git lag', 'git log')).toBe('');
  });
  test('shows nothing without a cue', () => {
    expect(ghost('git', undefined)).toBe('');
  });
});

describe('advance', () => {
  const steps = [
    { cmd: 'git init', caption: '' },
    { cmd: 'git commit -m "Rose"', caption: '' },
  ];
  test('moves on when the cued command succeeds', () => {
    expect(advance(steps, 0, 'git init', 0)).toBe(1);
  });
  test('ignores whitespace differences', () => {
    expect(advance(steps, 1, '  git commit   -m "Rose" ', 0)).toBe(2);
  });
  test('stays when the command failed', () => {
    expect(advance(steps, 0, 'git init', 128)).toBe(0);
  });
  test('stays on an off-script command', () => {
    expect(advance(steps, 0, 'git status', 0)).toBe(0);
  });
  test('stays past the last step', () => {
    expect(advance(steps, 2, 'git init', 0)).toBe(2);
  });
});
```

`web/nav.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import { move } from './nav';

const scenes = [{ story: [1, 2] }, { story: [1] }];

describe('move', () => {
  test('forward through cards, then into the git phase', () => {
    expect(move({ scene: 0, card: 0 }, 1, scenes)).toEqual({ scene: 0, card: 1 });
    expect(move({ scene: 0, card: 1 }, 1, scenes)).toEqual({ scene: 0, card: 2 });
  });
  test('forward from the git phase starts the next scene', () => {
    expect(move({ scene: 0, card: 2 }, 1, scenes)).toEqual({ scene: 1, card: 0 });
  });
  test('forward stops at the last git phase', () => {
    expect(move({ scene: 1, card: 1 }, 1, scenes)).toEqual({ scene: 1, card: 1 });
  });
  test('back from the first card lands on the previous git phase', () => {
    expect(move({ scene: 1, card: 0 }, -1, scenes)).toEqual({ scene: 0, card: 2 });
  });
  test('back stops at the very first card', () => {
    expect(move({ scene: 0, card: 0 }, -1, scenes)).toEqual({ scene: 0, card: 0 });
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test web/cue.test.ts web/nav.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `web/cue.ts`**

```ts
import type { Step } from '../shared/types';

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

export function ghost(typed: string, cue: string | undefined): string {
  return cue?.startsWith(typed) ? cue.slice(typed.length) : '';
}

export function advance(steps: Step[], index: number, ran: string, code: number): number {
  const cue = steps[index];
  return code === 0 && cue && normalize(ran) === normalize(cue.cmd) ? index + 1 : index;
}
```

- [ ] **Step 4: Implement `web/nav.ts`**

```ts
/** `card === story.length` is the scene's git phase. */
export type Position = { scene: number; card: number };

export function move(pos: Position, dir: 1 | -1, scenes: { story: unknown[] }[]): Position {
  const last = (scene: number) => scenes[scene].story.length;
  if (dir === 1) {
    if (pos.card < last(pos.scene)) return { ...pos, card: pos.card + 1 };
    if (pos.scene < scenes.length - 1) return { scene: pos.scene + 1, card: 0 };
    return pos;
  }
  if (pos.card > 0) return { ...pos, card: pos.card - 1 };
  if (pos.scene > 0) return { scene: pos.scene - 1, card: last(pos.scene - 1) };
  return pos;
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `bun test web/cue.test.ts web/nav.test.ts`
Expected: `14 pass, 0 fail`.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add web/cue.ts web/cue.test.ts web/nav.ts web/nav.test.ts
git commit -m "Add cue and navigation logic"
```

---

### Task 10: Graph layout

**Files:**
- Create: `web/graph/layout.ts`
- Test: `web/graph/layout.test.ts`

- [ ] **Step 1: Write the failing tests**

`web/graph/layout.test.ts`:
```ts
import { describe, expect, test } from 'bun:test';
import type { Commit, GraphModel } from '../../shared/types';
import { layout } from './layout';

const c = (hash: string, message: string, ...parents: string[]): Commit => ({ hash, short: hash, message, parents });
const graph = (g: Partial<GraphModel>): GraphModel => ({
  initialized: true,
  commits: [],
  branches: [],
  tags: [],
  head: { hash: null, branch: null },
  ...g,
});

describe('layout', () => {
  test('an empty timeline has no lanes and no HEAD position', () => {
    expect(layout(graph({}))).toEqual({ initialized: true, lanes: [], nodes: [], edges: [], head: null });
  });

  test('a straight timeline is one prime lane, one column per commit', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Dalek', 'a')],
        branches: [{ name: 'prime-timeline', hash: 'b' }],
        head: { hash: 'b', branch: 'prime-timeline' },
      }),
    );
    expect(l.lanes).toEqual([{ name: 'prime-timeline', kind: 'prime' }]);
    expect(l.nodes.map((n) => [n.message, n.col, n.lane])).toEqual([
      ['Rose', 0, 0],
      ['Dalek', 1, 0],
    ]);
    expect(l.edges.map((e) => [e.from.hash, e.to.hash])).toEqual([['a', 'b']]);
    expect(l.head).toEqual({ col: 1, lane: 0, label: 'HEAD → prime-timeline' });
  });

  test('a branch gets its own parallel lane below prime', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('b', 'Pete dies', 'a'), c('x', 'Rose saves Pete', 'a')],
        branches: [
          { name: 'fathers-day', hash: 'x' },
          { name: 'prime-timeline', hash: 'b' },
        ],
        head: { hash: 'x', branch: 'fathers-day' },
      }),
    );
    expect(l.lanes).toEqual([
      { name: 'prime-timeline', kind: 'prime' },
      { name: 'fathers-day', kind: 'parallel' },
    ]);
    expect(l.nodes.map((n) => [n.hash, n.lane])).toEqual([
      ['a', 0],
      ['b', 0],
      ['x', 1],
    ]);
    expect(l.nodes[2].branches).toEqual(['fathers-day']);
  });

  test('a branch with no commits of its own adds no lane', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose')],
        branches: [
          { name: 'prime-timeline', hash: 'a' },
          { name: 'petes-world', hash: 'a' },
        ],
      }),
    );
    expect(l.lanes.map((x) => x.name)).toEqual(['prime-timeline']);
    expect(l.nodes[0].branches).toEqual(['prime-timeline', 'petes-world']);
  });

  test('a commit on no branch goes to the detached lane', () => {
    const l = layout(
      graph({
        commits: [c('a', 'Rose'), c('x', 'Save Caecilius', 'a')],
        branches: [{ name: 'prime-timeline', hash: 'a' }],
        head: { hash: 'x', branch: null },
      }),
    );
    expect(l.lanes[1]).toEqual({ name: 'detached', kind: 'detached' });
    expect(l.head).toEqual({ col: 1, lane: 1, label: 'HEAD (detached)' });
  });

  test('tags are attached to their commit', () => {
    const l = layout(graph({ commits: [c('a', 'Pompeii')], tags: [{ name: 'fixed-point/pompeii', hash: 'a' }] }));
    expect(l.nodes[0].tags).toEqual(['fixed-point/pompeii']);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test web/graph/layout.test.ts`
Expected: FAIL — `Cannot find module './layout'`.

- [ ] **Step 3: Implement `web/graph/layout.ts`**

```ts
import type { GraphModel } from '../../shared/types';

export type LaneKind = 'prime' | 'parallel' | 'detached';
export type Lane = { name: string; kind: LaneKind };
export type Node = {
  hash: string;
  short: string;
  message: string;
  col: number;
  lane: number;
  tags: string[];
  branches: string[];
};
export type Edge = { from: Node; to: Node };
export type Head = { col: number; lane: number; label: string };
export type Layout = { initialized: boolean; lanes: Lane[]; nodes: Node[]; edges: Edge[]; head: Head | null };

const PRIME = 'prime-timeline';
const DETACHED = 'detached';

const kindOf = (name: string): LaneKind => {
  if (name === PRIME) return 'prime';
  if (name === DETACHED) return 'detached';
  return 'parallel';
};

export function layout(graph: GraphModel): Layout {
  const firstParent = new Map(graph.commits.map((c) => [c.hash, c.parents[0] ?? null]));
  const owner = new Map<string, string>();
  const claim = (tip: string | null, lane: string) => {
    for (let h = tip; h !== null && !owner.has(h); h = firstParent.get(h) ?? null) owner.set(h, lane);
  };

  const branches = [...graph.branches].sort(
    (a, b) => Number(b.name === PRIME) - Number(a.name === PRIME) || a.name.localeCompare(b.name),
  );
  for (const b of branches) claim(b.hash, b.name);
  for (const c of graph.commits) claim(c.hash, DETACHED);

  const used = new Set(owner.values());
  const laneNames = [...branches.map((b) => b.name), DETACHED].filter((n) => used.has(n));
  const lanes = laneNames.map((name) => ({ name, kind: kindOf(name) }));

  const nodes: Node[] = graph.commits.map((c, col) => ({
    hash: c.hash,
    short: c.short,
    message: c.message,
    col,
    lane: laneNames.indexOf(owner.get(c.hash) ?? DETACHED),
    tags: graph.tags.filter((t) => t.hash === c.hash).map((t) => t.name),
    branches: graph.branches.filter((b) => b.hash === c.hash).map((b) => b.name),
  }));

  const byHash = new Map(nodes.map((n) => [n.hash, n]));
  const edges: Edge[] = graph.commits.flatMap((c) =>
    c.parents.flatMap((p) => {
      const from = byHash.get(p);
      const to = byHash.get(c.hash);
      return from && to ? [{ from, to }] : [];
    }),
  );

  const at = graph.head.hash ? byHash.get(graph.head.hash) : undefined;
  const head = at
    ? { col: at.col, lane: at.lane, label: graph.head.branch ? `HEAD → ${graph.head.branch}` : 'HEAD (detached)' }
    : null;

  return { initialized: graph.initialized, lanes, nodes, edges, head };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test web/graph/layout.test.ts`
Expected: `6 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add web/graph/layout.ts web/graph/layout.test.ts
git commit -m "Lay out the graph model into lanes"
```

---

### Task 11: Flat timeline renderer

**Files:**
- Create: `web/graph/Tardis.tsx`, `web/graph/FlatTimeline.tsx`
- Test: `web/graph/FlatTimeline.test.tsx`

- [ ] **Step 1: Write the failing tests**

`web/graph/FlatTimeline.test.tsx`:
```tsx
import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { FlatTimeline } from './FlatTimeline';
import { layout } from './layout';

const pompeii = layout({
  initialized: true,
  commits: [
    { hash: 'a1', short: 'a1', message: 'The Fires of Pompeii', parents: [] },
    { hash: 'b2', short: 'b2', message: 'Planet of the Ood', parents: ['a1'] },
  ],
  branches: [{ name: 'prime-timeline', hash: 'b2' }],
  tags: [{ name: 'fixed-point/pompeii', hash: 'a1' }],
  head: { hash: 'a1', branch: null },
});

describe('FlatTimeline', () => {
  test('draws episodes, lane, tag, branch and HEAD', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByText('The Fires of Pompeii')).toBeTruthy();
    expect(screen.getByText('Planet of the Ood')).toBeTruthy();
    expect(screen.getByText('⚑ fixed-point/pompeii')).toBeTruthy();
    expect(screen.getAllByText('prime-timeline')).toHaveLength(2); // lane label + branch pill
    expect(screen.getByText('HEAD (detached)')).toBeTruthy();
  });

  test('parks the TARDIS on the HEAD commit', () => {
    render(<FlatTimeline layout={pompeii} />);
    expect(screen.getByTestId('tardis').style.transform).toBe('translate(260px, 160px)');
  });

  test('an empty timeline says so', () => {
    render(<FlatTimeline layout={layout({ initialized: false, commits: [], branches: [], tags: [], head: { hash: null, branch: null } })} />);
    expect(screen.getByText('Not a git repository')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test web/graph/FlatTimeline.test.tsx`
Expected: FAIL — `Cannot find module './FlatTimeline'`.

- [ ] **Step 3: Implement `web/graph/Tardis.tsx`**

```tsx
const WINDOWS = [-16, 2].flatMap((wx) => [-36, -22, -8].map((wy) => [wx, wy] as const));

export function Tardis({ x, y }: { x: number; y: number }) {
  return (
    <g data-testid="tardis" className="tardis" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className="tardis-bob">
        <g transform="scale(1.4)">
          <rect x={-4} y={-62} width={8} height={8} rx={2} className="tardis-lamp" />
          <rect x={-20} y={-54} width={40} height={6} fill="#163a80" />
          <rect x={-22} y={-48} width={44} height={8} fill="#0d1a33" />
          <text x={0} y={-42} fontSize={5} fill="#fff" textAnchor="middle">
            POLICE BOX
          </text>
          <rect x={-20} y={-40} width={40} height={48} fill="#1f4fa8" stroke="#163a80" strokeWidth={2} />
          {WINDOWS.map(([wx, wy]) => (
            <rect key={`${wx},${wy}`} x={wx} y={wy} width={14} height={11} fill={wy === -36 ? '#dfeaff' : '#163a80'} />
          ))}
          <line x1={0} y1={-40} x2={0} y2={8} stroke="#163a80" strokeWidth={2} />
        </g>
      </g>
    </g>
  );
}
```

- [ ] **Step 4: Implement `web/graph/FlatTimeline.tsx`**

```tsx
import type { Layout, LaneKind } from './layout';
import { Tardis } from './Tardis';

const X0 = 260;
const DX = 150;
const Y0 = 200;
const DY = 190;

const at = (p: { col: number; lane: number }) => ({ x: X0 + p.col * DX, y: Y0 + p.lane * DY });

const KICKER: Record<LaneKind, string> = {
  prime: 'UNIVERSE · PRIME',
  parallel: 'UNIVERSE · PARALLEL',
  detached: 'OFF THE TIMELINE',
};

function star(x: number, y: number, r: number) {
  return Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    return `${x + rr * Math.cos(a)},${y + rr * Math.sin(a)}`;
  }).join(' ');
}

export function FlatTimeline({ layout }: { layout: Layout }) {
  const cols = Math.max(0, ...layout.nodes.map((n) => n.col));
  const width = X0 + cols * DX + 260;
  const height = Y0 + Math.max(1, layout.lanes.length) * DY;
  const kind = (lane: number) => layout.lanes[lane]?.kind ?? 'prime';
  const tardis = at(layout.head ?? { col: 0, lane: 0 });

  return (
    <svg className="timeline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="timeline">
      {layout.lanes.map((lane, i) => (
        <g key={lane.name}>
          <line x1={40} x2={width - 40} y1={Y0 + i * DY} y2={Y0 + i * DY} className="lane-line" />
          <text x={40} y={Y0 + i * DY - 52} className="lane-kicker">
            {KICKER[lane.kind]}
          </text>
          <text x={40} y={Y0 + i * DY - 30} className="lane-name">
            {lane.name}
          </text>
        </g>
      ))}

      {layout.nodes.length === 0 && (
        <text x={width / 2} y={Y0} className="empty">
          {layout.initialized ? 'An empty timeline' : 'Not a git repository'}
        </text>
      )}

      {layout.edges.map(({ from, to }) => {
        const a = at(from);
        const b = at(to);
        const d =
          a.y === b.y
            ? `M${a.x} ${a.y} L${b.x} ${b.y}`
            : `M${a.x} ${a.y} C${a.x + DX * 0.6} ${a.y}, ${b.x - DX * 0.6} ${b.y}, ${b.x} ${b.y}`;
        return <path key={`${from.hash}-${to.hash}`} d={d} className={`edge lane-${kind(to.lane)}`} />;
      })}

      {layout.nodes.map((n) => {
        const { x, y } = at(n);
        return (
          <g key={n.hash}>
            {n.tags.length > 0 ? (
              <polygon points={star(x, y, 22)} className="fixed-point" />
            ) : (
              <circle cx={x} cy={y} r={13} className={`node lane-${kind(n.lane)}`} />
            )}
            <text x={x} y={y + 42} className="message">
              {n.message}
            </text>
            <text x={x} y={y + 60} className="hash">
              {n.short}
            </text>
            {n.tags.map((t, i) => (
              <text key={t} x={x} y={y - 34 - i * 18} className="tag">
                ⚑ {t}
              </text>
            ))}
            {n.branches.map((b, i) => (
              <g key={b} className={`pill lane-${b === 'prime-timeline' ? 'prime' : 'parallel'}`}>
                <rect x={x + 24} y={y - 13 + i * 30} width={b.length * 9 + 16} height={26} rx={6} />
                <text x={x + 32} y={y + 5 + i * 30}>
                  {b}
                </text>
              </g>
            ))}
          </g>
        );
      })}

      <Tardis x={tardis.x} y={tardis.y - 40} />
      {layout.head && (
        <text x={tardis.x} y={tardis.y - 140} className="head-label">
          {layout.head.label}
        </text>
      )}
    </svg>
  );
}
```

Note: the HEAD label sits at `y - 140`, above the TARDIS; it does not animate with it (the label snaps, the TARDIS glides).

- [ ] **Step 5: Run to verify they pass**

Run: `bun test web/graph/FlatTimeline.test.tsx`
Expected: `3 pass, 0 fail`.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add web/graph/Tardis.tsx web/graph/FlatTimeline.tsx web/graph/FlatTimeline.test.tsx
git commit -m "Render the timeline as flat universe lanes"
```

---

### Task 12: Story card

**Files:**
- Create: `web/story/StoryCardView.tsx`
- Test: `web/story/StoryCardView.test.tsx`

- [ ] **Step 1: Write the failing tests**

`web/story/StoryCardView.test.tsx`:
```tsx
import { describe, expect, test } from 'bun:test';
import { render, screen } from '@testing-library/react';
import type { StoryCard } from '../../shared/types';
import { StoryCardView } from './StoryCardView';

const companions: StoryCard = {
  title: 'The Companions',
  text: 'They travel with him.',
  images: [
    { src: '/rose.jpg', name: 'Rose Tyler', fate: 'TRAPPED IN A PARALLEL UNIVERSE' },
    { src: '/donna.jpg', name: 'Donna Noble', fate: 'MEMORY WIPED' },
  ],
};

describe('StoryCardView', () => {
  test('shows title, text and the first image captions', () => {
    render(<StoryCardView card={companions} />);
    expect(screen.getByText('The Companions')).toBeTruthy();
    expect(screen.getByText('They travel with him.')).toBeTruthy();
    expect(screen.getByText('Rose Tyler')).toBeTruthy();
    expect(screen.getByText('TRAPPED IN A PARALLEL UNIVERSE')).toBeTruthy();
  });

  test('rotates to the next image and its captions', async () => {
    render(<StoryCardView card={companions} intervalMs={20} />);
    expect(await screen.findByText('Donna Noble', {}, { timeout: 500 })).toBeTruthy();
    expect(screen.getByText('MEMORY WIPED')).toBeTruthy();
  });

  test('a single image shows no position dots', () => {
    const { container } = render(
      <StoryCardView card={{ title: 'The TARDIS', text: 'His time machine.', images: [{ src: '/tardis.jpg' }] }} />,
    );
    expect(container.querySelector('.dots')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test web/story/`
Expected: FAIL — `Cannot find module './StoryCardView'`.

- [ ] **Step 3: Implement `web/story/StoryCardView.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { StoryCard } from '../../shared/types';

export function StoryCardView({ card, intervalMs = 3000 }: { card: StoryCard; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const count = card.images.length;

  useEffect(() => {
    if (count < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  const image = card.images[index];
  return (
    <section className="story">
      <figure>
        <div className="frame">
          {card.images.map((img, i) => (
            <img key={img.src} src={img.src} alt={img.name ?? card.title} className={i === index ? 'shown' : ''} />
          ))}
        </div>
        <figcaption>
          {image?.name && <div className="name">{image.name}</div>}
          {image?.fate && <div className="fate">{image.fate}</div>}
          {count > 1 && (
            <div className="dots">
              {card.images.map((img, i) => (
                <span key={img.src} className={i === index ? 'on' : ''} />
              ))}
            </div>
          )}
        </figcaption>
      </figure>
      <div className="story-text">
        <h2>{card.title}</h2>
        <p>{card.text}</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test web/story/`
Expected: `3 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add web/story/
git commit -m "Add rotating story card"
```

---

### Task 13: Console

**Files:**
- Create: `web/console/Console.tsx`
- Test: `web/console/Console.test.tsx`

- [ ] **Step 1: Write the failing tests**

`web/console/Console.test.tsx`:
```tsx
import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Console } from './Console';

const cue = { cmd: 'git rebase prime-timeline', caption: 'Rose drags her universe onto the prime timeline' };

function setup(value: string) {
  const onChange = mock((_: string) => {});
  const onRun = mock((_: string) => {});
  render(
    <Console
      cue={cue}
      value={value}
      onChange={onChange}
      onRun={onRun}
      output="$ git log"
      inputRef={createRef<HTMLInputElement>()}
    />,
  );
  return { onChange, onRun, input: screen.getByLabelText('git command') };
}

describe('Console', () => {
  test('shows the rest of the cue as ghost text, plus the caption and output', () => {
    const { container } = render(
      <Console cue={cue} value="git rebase prime-t" onChange={() => {}} onRun={() => {}} output="$ git log" inputRef={createRef<HTMLInputElement>()} />,
    );
    expect(container.querySelector('.ghost')?.textContent).toBe('git rebase prime-timeline');
    expect(container.querySelector('.ghost .typed')?.textContent).toBe('git rebase prime-t');
    expect(screen.getByText(cue.caption)).toBeTruthy();
    expect(screen.getByText('$ git log')).toBeTruthy();
  });

  test('Tab accepts the cue', () => {
    const { onChange, input } = setup('git reb');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(onChange).toHaveBeenCalledWith('git rebase prime-timeline');
  });

  test('Enter runs what was typed', () => {
    const { onRun, input } = setup('git status');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).toHaveBeenCalledWith('git status');
  });

  test('Enter on an empty input does nothing', () => {
    const { onRun, input } = setup('');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onRun).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `bun test web/console/`
Expected: FAIL — `Cannot find module './Console'`.

- [ ] **Step 3: Implement `web/console/Console.tsx`**

```tsx
import type { KeyboardEvent, RefObject } from 'react';
import type { Step } from '../../shared/types';
import { ghost } from '../cue';

type Props = {
  cue: Step | undefined;
  value: string;
  onChange: (value: string) => void;
  onRun: (cmd: string) => void;
  output: string;
  inputRef: RefObject<HTMLInputElement | null>;
};

export function Console({ cue, value, onChange, onRun, output, inputRef }: Props) {
  const rest = ghost(value, cue?.cmd);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) onRun(value);
    else if (e.key === 'Tab') {
      e.preventDefault();
      if (rest) onChange(value + rest);
    } else if (e.key === 'Escape') e.currentTarget.blur();
  };

  return (
    <div className="console">
      <div className="prompt">
        <div className="line">
          <span className="sigil">$</span>
          <div className="field">
            <div className="ghost" aria-hidden="true">
              <span className="typed">{value}</span>
              {rest}
            </div>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              aria-label="git command"
            />
          </div>
        </div>
        {cue && <div className="caption">{cue.caption}</div>}
      </div>
      <pre className="output">{output}</pre>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `bun test web/console/`
Expected: `4 pass, 0 fail`.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
bun run lint && bun run typecheck
git add web/console/
git commit -m "Add command console with ghost cue"
```

---

### Task 14: App shell

**Files:**
- Create: `web/api.ts`, `web/App.tsx`, `web/main.tsx`, `web/styles.css`
- Modify: `web/index.html` (replace stub)
- Test: `web/App.test.tsx`

- [ ] **Step 1: Create `web/api.ts`**

```ts
import type { GraphModel, RunResult, SceneView } from '../shared/types';

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}

export async function fetchScenes(): Promise<SceneView[]> {
  return (await fetch('/api/scenes')).json();
}

export const enterScene = (id: string) => post<GraphModel>(`/api/scenes/${id}/enter`);
export const runCommand = (input: string) => post<RunResult>('/api/run', { input });
```

- [ ] **Step 2: Write the failing tests**

`web/App.test.tsx`:
```tsx
import { describe, expect, mock, test } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import type { GraphModel, SceneView } from '../shared/types';

const graph: GraphModel = {
  initialized: true,
  commits: [{ hash: 'a1', short: 'a1', message: 'Episode one', parents: [] }],
  branches: [{ name: 'prime-timeline', hash: 'a1' }],
  tags: [],
  head: { hash: 'a1', branch: 'prime-timeline' },
};
const scenes: SceneView[] = [
  {
    id: 'rose',
    episode: 'S01E01',
    title: 'Rose',
    story: [{ title: 'The Doctor', text: 'This is the Doctor.', images: [] }],
    steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }],
  },
];
const runCommand = mock(async () => ({ output: 'a1 Episode one', code: 0, graph }));

mock.module('./api', () => ({
  fetchScenes: async () => scenes,
  enterScene: async () => graph,
  runCommand,
}));
const { App } = await import('./App');

async function toGitPhase() {
  render(<App />);
  expect(await screen.findByText('The Doctor')).toBeTruthy();
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  return screen.findByLabelText('git command');
}

describe('App', () => {
  test('opens on the first story card, then → reaches the git phase', async () => {
    await toGitPhase();
    expect(await screen.findByText('Episode one')).toBeTruthy();
    expect(screen.getByText('Where is the TARDIS?')).toBeTruthy();
  });

  test('running the cued command shows its output and advances the cue', async () => {
    const input = await toGitPhase();
    fireEvent.change(input, { target: { value: 'git log' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(await screen.findByText(/a1 Episode one/)).toBeTruthy();
    expect(runCommand).toHaveBeenCalledWith('git log');
    expect(screen.queryByText('Where is the TARDIS?')).toBeNull();
  });
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `bun test web/App.test.tsx`
Expected: FAIL — `Cannot find module './App'`.

- [ ] **Step 4: Implement `web/App.tsx`**

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GraphModel, SceneView } from '../shared/types';
import { enterScene, fetchScenes, runCommand } from './api';
import { Console } from './console/Console';
import { advance } from './cue';
import { FlatTimeline } from './graph/FlatTimeline';
import { layout } from './graph/layout';
import { move, type Position } from './nav';
import { StoryCardView } from './story/StoryCardView';

export function App() {
  const [scenes, setScenes] = useState<SceneView[]>([]);
  const [pos, setPos] = useState<Position>({ scene: 0, card: 0 });
  const [graph, setGraph] = useState<GraphModel | null>(null);
  const [cueIndex, setCueIndex] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScenes().then(setScenes);
  }, []);

  const scene = scenes[pos.scene];
  const sceneId = scene?.id;
  const gitPhase = scene !== undefined && pos.card === scene.story.length;

  const reset = useCallback(async () => {
    if (!sceneId) return;
    setGraph(await enterScene(sceneId));
    setCueIndex(0);
    setInput('');
    setOutput('');
  }, [sceneId]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (gitPhase) inputRef.current?.focus();
  }, [gitPhase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement;
      if (typing && (e.target as HTMLInputElement).value !== '') return;
      if (e.key === 'ArrowRight') setPos((p) => move(p, 1, scenes));
      else if (e.key === 'ArrowLeft') setPos((p) => move(p, -1, scenes));
      else if (e.key === 'r' && !typing) reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scenes, reset]);

  if (!scene) return null;

  const run = async (cmd: string) => {
    const result = await runCommand(cmd);
    setOutput(`$ ${cmd}\n${result.output}`);
    setGraph(result.graph);
    setCueIndex((i) => advance(scene.steps, i, cmd, result.code));
    setInput('');
  };

  return (
    <>
      <header>
        <div className="ep">
          <small>{scene.episode}</small>
          {scene.title}
        </div>
        <div className="progress">
          scene {pos.scene + 1} / {scenes.length}
        </div>
      </header>
      {gitPhase ? (
        <>
          <main>{graph && <FlatTimeline layout={layout(graph)} />}</main>
          <Console
            cue={scene.steps[cueIndex]}
            value={input}
            onChange={setInput}
            onRun={run}
            output={output}
            inputRef={inputRef}
          />
        </>
      ) : (
        <StoryCardView key={`${scene.id}-${pos.card}`} card={scene.story[pos.card]} />
      )}
    </>
  );
}
```

- [ ] **Step 5: Run to verify they pass**

Run: `bun test web/App.test.tsx`
Expected: `2 pass, 0 fail`.

- [ ] **Step 6: Create `web/main.tsx`**

```tsx
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
```

- [ ] **Step 7: Replace `web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TARDIS Console</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=JetBrains+Mono:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create `web/styles.css`**

```css
:root {
  --space: #050816;
  --space-2: #0b1230;
  --tardis: #1f4fa8;
  --glow: #7fd4ff;
  --gold: #ffcc4d;
  --danger: #ff5a6e;
  --text: #e6ecff;
  --muted: #8a95c2;
  --panel: rgba(10, 16, 40, 0.82);
  --line: rgba(127, 212, 255, 0.25);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  height: 100%;
  overflow: hidden;
  color: var(--text);
  font-family: "JetBrains Mono", monospace;
  background: radial-gradient(ellipse at 50% 40%, var(--space-2), var(--space) 70%);
}

#root {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
}

header .ep {
  font-family: Orbitron, sans-serif;
  font-size: 22px;
  letter-spacing: 2px;
}

header .ep small {
  color: var(--muted);
  font-size: 14px;
  margin-right: 12px;
}

header .progress {
  color: var(--muted);
  font-size: 13px;
}

main {
  min-height: 0;
}

/* timeline */
.timeline {
  width: 100%;
  height: 100%;
}

.lane-line {
  stroke: var(--line);
  stroke-dasharray: 2 10;
}

.lane-kicker {
  fill: var(--muted);
  font-size: 13px;
  letter-spacing: 3px;
}

.lane-name {
  fill: var(--text);
  font: 700 20px Orbitron, sans-serif;
}

.empty {
  fill: var(--muted);
  font-size: 20px;
  text-anchor: middle;
}

.edge {
  fill: none;
  stroke-width: 4;
  opacity: 0.8;
  filter: drop-shadow(0 0 4px currentColor);
}

.node {
  fill: var(--space);
  stroke-width: 4;
  filter: drop-shadow(0 0 6px currentColor);
}

.edge.lane-prime,
.node.lane-prime {
  stroke: var(--glow);
  color: var(--glow);
}

.edge.lane-parallel,
.node.lane-parallel {
  stroke: var(--danger);
  color: var(--danger);
}

.edge.lane-detached,
.node.lane-detached {
  stroke: var(--muted);
  color: var(--muted);
  stroke-dasharray: 6 6;
}

.fixed-point {
  fill: var(--gold);
  filter: drop-shadow(0 0 8px var(--gold));
}

.message {
  fill: var(--text);
  font-size: 14px;
  text-anchor: middle;
}

.hash {
  fill: var(--muted);
  font-size: 11px;
  text-anchor: middle;
}

.tag {
  fill: var(--gold);
  font-size: 13px;
  font-weight: 600;
  text-anchor: middle;
}

.pill rect {
  fill: var(--tardis);
}

.pill.lane-parallel rect {
  fill: #a8324a;
}

.pill text {
  fill: #fff;
  font-size: 14px;
  font-weight: 600;
}

.head-label {
  fill: var(--glow);
  font: 700 16px Orbitron, sans-serif;
  text-anchor: middle;
}

.tardis {
  transition: transform 0.8s ease-in-out;
}

.tardis-bob {
  animation: bob 3s ease-in-out infinite;
}

.tardis-lamp {
  fill: #fff;
  filter: drop-shadow(0 0 6px #bfe4ff);
}

@keyframes bob {
  50% {
    transform: translateY(-8px);
  }
}

/* console */
.console {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 24px 24px;
}

.console > * {
  margin: 0;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
}

.line {
  display: flex;
  gap: 10px;
}

.sigil {
  color: var(--glow);
}

.field {
  position: relative;
  flex: 1;
}

.field .ghost,
.field input {
  font: inherit;
  white-space: pre;
}

.field .ghost {
  position: absolute;
  inset: 0;
  color: rgba(138, 149, 194, 0.45);
  pointer-events: none;
}

.field .ghost .typed {
  visibility: hidden;
}

.field input {
  position: relative;
  width: 100%;
  padding: 0;
  border: 0;
  outline: 0;
  color: var(--text);
  background: transparent;
  caret-color: var(--glow);
}

.caption {
  color: var(--muted);
  font-size: 13px;
  margin-top: 8px;
}

.output {
  color: var(--muted);
  font-size: 13px;
  max-height: 180px;
  overflow: auto;
}

/* story cards */
.story {
  grid-row: 2 / 4;
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 48px;
  align-items: center;
  padding: 24px 64px 48px;
}

.story figure {
  margin: 0;
}

.story .frame {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--line);
  box-shadow: 0 0 40px rgba(79, 134, 255, 0.25);
}

.story .frame img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.story .frame img.shown {
  opacity: 1;
}

.story figcaption {
  display: grid;
  grid-template-columns: 1fr auto;
  margin-top: 16px;
}

.story .name {
  font: 700 20px Orbitron, sans-serif;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.story .fate {
  grid-column: 1;
  color: var(--danger);
  font-weight: 600;
  letter-spacing: 1px;
}

.story .dots {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: end;
  display: flex;
  gap: 8px;
}

.story .dots span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--glow);
}

.story .dots span.on {
  background: var(--glow);
}

.story-text h2 {
  font: 700 40px Orbitron, sans-serif;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 24px;
}

.story-text p {
  font-size: 22px;
  line-height: 1.6;
  color: var(--text);
}
```

- [ ] **Step 9: Run the full suite, lint, typecheck**

Run: `bun test && bun run lint && bun run typecheck`
Expected: all pass (`68 pass, 0 fail`), no lint warnings, tsc exits 0.

- [ ] **Step 10: Commit**

```bash
git add web/
git commit -m "Wire up the app shell, styles and keys"
```

---

### Task 15: Assets, README, smoke test

**Files:**
- Create: `assets/**` (Wouter supplies the stills), `scenes/assets.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

`scenes/assets.test.ts`:
```ts
import { expect, test } from 'bun:test';
import { join } from 'node:path';
import { scenes } from '.';

const root = join(import.meta.dir, '..');

test('every story image exists under assets/', async () => {
  const srcs = scenes.flatMap((s) => s.story.flatMap((card) => card.images.map((i) => i.src)));
  const missing = [];
  for (const src of srcs) if (!(await Bun.file(join(root, src)).exists())) missing.push(src);
  expect(missing).toEqual([]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test scenes/assets.test.ts`
Expected: FAIL — `missing` lists all 16 image paths.

- [ ] **Step 3: Wouter adds the stills** (manual)

```
assets/tardis.jpg
assets/doctors/09-eccleston.jpg  10-tennant.jpg  11-smith.jpg  12-capaldi.jpg
assets/doctors/13-whittaker.jpg  14-tennant.jpg  15-gatwa.jpg
assets/companions/rose.jpg  donna.jpg  amy-rory.jpg  clara.jpg  bill.jpg  river.jpg
assets/episodes/rose.jpg  pompeii.jpg
```

Landscape, ≥1600px wide (frame is 16:10, `object-fit: cover`).

- [ ] **Step 4: Run to verify it passes**

Run: `bun test scenes/assets.test.ts`
Expected: `1 pass, 0 fail`.

- [ ] **Step 5: Add a Run section to `README.md`** (after the intro paragraph)

```markdown
## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.
```

- [ ] **Step 6: Full suite**

Run: `bun test && bun run lint && bun run typecheck`
Expected: all pass, no warnings.

- [ ] **Step 7: Manual smoke test** (Wouter, visual)

`bun run dev`, open http://localhost:3000:
- [ ] Doctor card: image crossfades every ~3s, name swaps.
- [ ] Companions card: name + fate swap with the image.
- [ ] `→` past the Rose card: git phase, input focused, ghost `git init` visible.
- [ ] Type `git init`, Enter: "An empty timeline"; cue moves to `git add .`.
- [ ] `Tab` completes the cue; `git commit -m "Rose"` shows the Rose node with the TARDIS above it.
- [ ] `Esc`, `r`: scene resets to "Not a git repository".
- [ ] `→` into Fixed Points; run all cues: gold star on The Fires of Pompeii, TARDIS glides back on checkout, label `HEAD (detached)`, glides forward on switch.

- [ ] **Step 8: Commit**

```bash
git add assets/ scenes/assets.test.ts README.md
git commit -m "Add story stills and run instructions"
```
