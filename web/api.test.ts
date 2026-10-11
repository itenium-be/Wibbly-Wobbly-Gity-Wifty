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

  test('playEpisode posts the episode code', async () => {
    let seen: { url: string; init?: RequestInit } | undefined;
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      seen = { url, init };
      return new Response('{}');
    }) as unknown as typeof fetch;
    const { playEpisode } = await real();
    await playEpisode('S01E02');
    expect(seen?.url).toBe('/api/episode');
    expect(seen?.init).toMatchObject({ method: 'POST', body: '{"code":"S01E02"}' });
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

  test('readFile fetches the file as text with the path encoded', async () => {
    let url = '';
    globalThis.fetch = (async (u: string) => {
      url = u;
      return new Response('# Rose\n', { status: 200 });
    }) as unknown as typeof fetch;
    const { readFile } = await real();
    expect(await readFile('episodes/bad wolf.md')).toBe('# Rose\n');
    expect(url).toBe('/api/file?path=episodes%2Fbad%20wolf.md');
  });

  test('readFile throws on a non-OK response', async () => {
    respond('no such file', 404);
    const { readFile } = await real();
    await expect(readFile('nope.md')).rejects.toThrow('404 no such file');
  });

  test('writeFile PUTs the content and returns the working directory', async () => {
    let init: RequestInit | undefined;
    globalThis.fetch = (async (_: string, i: RequestInit) => {
      init = i;
      return Response.json({ files: [], merging: false });
    }) as unknown as typeof fetch;
    const { writeFile } = await real();
    expect(await writeFile('a.md', 'x')).toEqual({ files: [], merging: false });
    expect(init?.method).toBe('PUT');
    expect(JSON.parse(String(init?.body))).toEqual({ path: 'a.md', content: 'x' });
  });
});
