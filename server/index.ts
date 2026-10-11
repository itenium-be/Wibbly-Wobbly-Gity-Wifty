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
