import { join, resolve, sep } from 'node:path';
import { scenes } from '../scenes';
import index from '../web/index.html';
import { createRoutes } from './api';
import { Engine } from './engine';
import { tardisHome } from './home';

const root = join(import.meta.dir, '..');
const assets = join(root, 'assets');
const port = Number(process.env.PORT ?? 3000);
const engine = new Engine(tardisHome(process.env, port), scenes);
await engine.prepare();

const server = Bun.serve({
  hostname: 'localhost',
  port,
  development: { hmr: true, console: true },
  routes: {
    '/': index,
    '/assets/*': async (req) => {
      const path = resolve(join(root, new URL(req.url).pathname));
      if (!path.startsWith(assets + sep)) return new Response('not found', { status: 404 });
      const file = Bun.file(path);
      return (await file.exists()) ? new Response(file) : new Response('not found', { status: 404 });
    },
    ...createRoutes(engine, scenes),
  },
});

console.log(`TARDIS console: ${server.url}`);
