import { beforeAll, describe, expect, test } from 'bun:test';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { LiveState, RunResult, Scene, SceneView, WorkDir } from '../shared/types';
import { tmp } from '../test/tmp';
import { createRoutes } from './api';
import { Engine } from './engine';

const scenes: Scene[] = [
  {
    id: 'rose',
    episode: 'S01E01',
    title: 'Rose',
    story: [],
    build: [
      { git: ['init', '-q'] },
      { commit: 'Rose', files: { 'episodes/rose.md': '# Rose\n', 'TARDIS.md': 'Location: London, 2005\n' } },
    ],
    steps: [
      { cmd: 'git log', caption: 'Where is the TARDIS?' },
      { episode: { code: 'S01E02', title: 'The End of the World', set: { Location: 'Platform One' } } },
    ],
  },
];

const post = (path: string, body?: unknown, params: Record<string, string> = {}) =>
  Object.assign(
    new Request(`http://tardis${path}`, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    { params },
  );

const get = (path: string) => new Request(`http://tardis${path}`);
const put = (body: unknown) =>
  new Request('http://tardis/api/file', {
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('api', () => {
  let routes: ReturnType<typeof createRoutes>;
  let home: string;
  beforeAll(async () => {
    home = await tmp();
    const engine = new Engine(home, scenes);
    await engine.prepare();
    routes = createRoutes(engine, scenes);
  });

  test('lists scenes without their build script', async () => {
    const body = (await routes['/api/scenes'].GET().json()) as SceneView[];
    expect(body).toEqual([
      {
        id: 'rose',
        episode: 'S01E01',
        title: 'Rose',
        story: [],
        steps: scenes[0]?.steps,
      },
    ]);
  });

  test('entering a scene returns its graph and working directory', async () => {
    const res = await routes['/api/scenes/:id/enter'].POST(post('/api/scenes/rose/enter', undefined, { id: 'rose' }));
    const body = (await res.json()) as LiveState;
    expect(body.graph.commits.map((c) => c.message)).toEqual(['Rose']);
    expect(body.workdir.files.map((f) => f.path)).toEqual(['TARDIS.md', 'episodes/rose.md']);
  });

  test('plays an episode', async () => {
    await routes['/api/scenes/:id/enter'].POST(post('/api/scenes/rose/enter', undefined, { id: 'rose' }));
    const res = await routes['/api/episode'].POST(post('/api/episode', { code: 'S01E02' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ cmd: 'git commit -am "The End of the World"', code: 0 });
  });

  test('rejects an unknown episode with 404 and a malformed body with 400', async () => {
    expect((await routes['/api/episode'].POST(post('/api/episode', { code: 'S99E99' }))).status).toBe(404);
    expect((await routes['/api/episode'].POST(post('/api/episode', { nope: 1 }))).status).toBe(400);
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

  test('a malformed run body is a 400', async () => {
    const notJson = Object.assign(new Request('http://tardis/api/run', { method: 'POST', body: 'git log' }), {
      params: {},
    });
    expect((await routes['/api/run'].POST(notJson)).status).toBe(400);
    expect((await routes['/api/run'].POST(post('/api/run', { input: 42 }))).status).toBe(400);
    expect((await routes['/api/run'].POST(post('/api/run', null))).status).toBe(400);
  });

  describe('/api/file', () => {
    const enter = () => routes['/api/scenes/:id/enter'].POST(post('/api/scenes/rose/enter', undefined, { id: 'rose' }));

    test('GET returns the file content', async () => {
      await enter();
      const res = await routes['/api/file'].GET(get('/api/file?path=episodes/rose.md'));
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('# Rose\n');
    });

    test('GET of a missing file is a 404', async () => {
      await enter();
      expect((await routes['/api/file'].GET(get('/api/file?path=nope.md'))).status).toBe(404);
    });

    test.each(['/api/file', '/api/file?path=../x', '/api/file?path=/etc/passwd', '/api/file?path=.git/config'])(
      'GET %s is a 400',
      async (url) => {
        expect((await routes['/api/file'].GET(get(url))).status).toBe(400);
      },
    );

    test.each(['episodes', 'episodes/', 'episodes/rose.md/', 'episodes/rose.md/x'])(
      'GET and PUT of the non-file %p are a 400',
      async (path) => {
        await enter();
        expect((await routes['/api/file'].GET(get(`/api/file?path=${path}`))).status).toBe(400);
        expect((await routes['/api/file'].PUT(put({ path, content: 'x' }))).status).toBe(400);
      },
    );

    describe('symlinks', () => {
      let outside: string;
      beforeAll(async () => {
        await enter();
        outside = join(await tmp(), 'secret.txt');
        await writeFile(outside, 'secret\n');
        await symlink(outside, join(home, 'live', 'leak.txt'));
        await symlink(join(home, 'live', '.git'), join(home, 'live', 'dotgit'));
        await mkdir(join(home, 'live', 'real'));
        await symlink(join(home, 'live', '.git'), join(home, 'live', 'real', 'inner'));
      });

      test.each(['leak.txt', 'dotgit/config', 'real/inner/HEAD'])('GET through %s is a 400', async (path) => {
        expect((await routes['/api/file'].GET(get(`/api/file?path=${path}`))).status).toBe(400);
      });

      test.each(['leak.txt', 'dotgit/config', 'dotgit/new', 'real/inner/new/file'])(
        'PUT through %s is a 400',
        async (path) => {
          expect((await routes['/api/file'].PUT(put({ path, content: 'pwned\n' }))).status).toBe(400);
          expect(await readFile(outside, 'utf8')).toBe('secret\n');
        },
      );
    });

    test('PUT writes the file and returns the working directory', async () => {
      await enter();
      const res = await routes['/api/file'].PUT(put({ path: 'episodes/rose.md', content: '# Bad Wolf\n' }));
      expect(res.status).toBe(200);
      expect(((await res.json()) as WorkDir).files).toContainEqual({
        path: 'episodes/rose.md',
        status: 'modified',
        code: ' M',
      });
    });

    test.each([
      'not json',
      { path: 'a.md' },
      { path: 42, content: 'x' },
      { path: '../a.md', content: 'x' },
      { path: '.git/HEAD', content: 'x' },
    ])('PUT %p is a 400', async (body) => {
      expect((await routes['/api/file'].PUT(put(body))).status).toBe(400);
    });
  });
});
