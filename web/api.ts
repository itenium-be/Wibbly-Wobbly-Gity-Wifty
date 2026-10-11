import type { LiveState, RunResult, SceneView } from '../shared/types';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function post<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return json(res);
}

export async function fetchScenes(): Promise<SceneView[]> {
  return json(await fetch('/api/scenes'));
}

export const enterScene = (id: string) => post<LiveState>(`/api/scenes/${id}/enter`);
export const runCommand = (input: string) => post<RunResult>('/api/run', { input });
