import type { Scene, SceneView } from '../shared/types';
import { type Engine, InvalidCommitError, UnknownCommitError, UnknownEpisodeError } from './engine';
import { InvalidPathError } from './workdir';

type RouteRequest = Request & { params: Record<string, string> };

const toView = (s: Scene): SceneView => ({
  id: s.id,
  episode: s.episode,
  title: s.title,
  story: s.story,
  steps: s.steps,
});

async function fileErrors(task: () => Promise<Response>): Promise<Response> {
  try {
    return await task();
  } catch (e) {
    if (e instanceof InvalidPathError) return new Response(e.message, { status: 400 });
    const code = (e as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return new Response('no such file', { status: 404 });
    if (code === 'EISDIR' || code === 'ENOTDIR') return new Response('not a file', { status: 400 });
    throw e;
  }
}

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
        const body = (await req.json().catch(() => null)) as { input?: unknown } | null;
        if (typeof body?.input !== 'string') return new Response('bad request', { status: 400 });
        return Response.json(await engine.run(body.input));
      },
    },
    '/api/episode': {
      POST: async (req: Request) => {
        const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
        if (typeof body?.code !== 'string') return new Response('bad request', { status: 400 });
        try {
          return Response.json(await engine.episode(body.code));
        } catch (e) {
          if (e instanceof UnknownEpisodeError) return new Response(e.message, { status: 404 });
          throw e;
        }
      },
    },
    '/api/show': {
      GET: async (req: Request) => {
        const hash = new URL(req.url).searchParams.get('hash');
        if (hash === null) return new Response('bad request', { status: 400 });
        try {
          return new Response(await engine.show(hash));
        } catch (e) {
          if (e instanceof InvalidCommitError) return new Response(e.message, { status: 400 });
          if (e instanceof UnknownCommitError) return new Response(e.message, { status: 404 });
          throw e;
        }
      },
    },
    '/api/file': {
      GET: (req: Request) => {
        const path = new URL(req.url).searchParams.get('path');
        if (path === null) return new Response('bad request', { status: 400 });
        return fileErrors(async () => new Response(await engine.readFile(path)));
      },
      PUT: async (req: Request) => {
        const body = (await req.json().catch(() => null)) as { path?: unknown; content?: unknown } | null;
        const { path, content } = body ?? {};
        if (typeof path !== 'string' || typeof content !== 'string')
          return new Response('bad request', { status: 400 });
        return fileErrors(async () => Response.json(await engine.writeFile(path, content)));
      },
    },
  };
}
