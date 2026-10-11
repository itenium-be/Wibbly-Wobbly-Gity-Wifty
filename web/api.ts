import type { BlameHunk, EpisodeResult, LiveState, RunResult, SceneView, WorkDir } from '../shared/types';

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res;
}

async function json<T>(res: Response): Promise<T> {
  return (await ok(res)).json();
}

async function send<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return json(res);
}

export async function fetchScenes(): Promise<SceneView[]> {
  return json(await fetch('/api/scenes'));
}

export const enterScene = (id: string) => send<LiveState>('POST', `/api/scenes/${id}/enter`);
export const runCommand = (input: string) => send<RunResult>('POST', '/api/run', { input });
export const playEpisode = (code: string) => send<EpisodeResult>('POST', '/api/episode', { code });

export async function readFile(path: string): Promise<string> {
  return (await ok(await fetch(`/api/file?path=${encodeURIComponent(path)}`))).text();
}

export async function showCommit(hash: string): Promise<string> {
  return (await ok(await fetch(`/api/show?hash=${encodeURIComponent(hash)}`))).text();
}

export async function blameFile(path: string): Promise<BlameHunk[]> {
  return json(await fetch(`/api/blame?path=${encodeURIComponent(path)}`));
}

export const writeFile = (path: string, content: string) => send<WorkDir>('PUT', '/api/file', { path, content });
