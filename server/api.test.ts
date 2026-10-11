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
    new Request(`http://tardis${path}`, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
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
      {
        id: 'rose',
        episode: 'S01E01',
        title: 'Rose',
        story: [],
        steps: [{ cmd: 'git log', caption: 'Where is the TARDIS?' }],
      },
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

  test('a malformed run body is a 400', async () => {
    const notJson = Object.assign(new Request('http://tardis/api/run', { method: 'POST', body: 'git log' }), {
      params: {},
    });
    expect((await routes['/api/run'].POST(notJson)).status).toBe(400);
    expect((await routes['/api/run'].POST(post('/api/run', { input: 42 }))).status).toBe(400);
    expect((await routes['/api/run'].POST(post('/api/run', null))).status).toBe(400);
  });
});
