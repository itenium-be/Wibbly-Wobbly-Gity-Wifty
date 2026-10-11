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
