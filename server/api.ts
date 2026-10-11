import type { Scene, SceneView } from '../shared/types';
import type { Engine } from './engine';

type RouteRequest = Request & { params: Record<string, string> };

const toView = (s: Scene): SceneView => ({
  id: s.id,
  episode: s.episode,
  title: s.title,
  story: s.story,
  steps: s.steps,
});

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
