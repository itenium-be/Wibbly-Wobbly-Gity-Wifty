import { afterEach, describe, expect, test } from 'bun:test';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// The query string bypasses App.test.tsx's process-wide mock.module('./api').
const realPath = './api?real';
const real = () => import(realPath) as Promise<typeof import('./api')>;

const respond = (body: string, status: number) => {
  globalThis.fetch = (async () => new Response(body, { status })) as unknown as typeof fetch;
};

describe('api', () => {
  test('a non-OK text body becomes a status-prefixed Error', async () => {
    respond('Internal Server Error', 500);
    const { runCommand } = await real();
    await expect(runCommand('git log')).rejects.toThrow('500 Internal Server Error');
  });

  test('fetchScenes throws on a non-OK response', async () => {
    respond('nope', 404);
    const { fetchScenes } = await real();
    await expect(fetchScenes()).rejects.toThrow('404 nope');
  });

  test('OK responses are parsed as JSON', async () => {
    respond('[]', 200);
    const { fetchScenes } = await real();
    expect(await fetchScenes()).toEqual([]);
  });
});
