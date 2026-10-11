import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Every server rebuilds its snapshots and live repo on start; a shared home lets one server rewrite another's. */
export const tardisHome = (env: Record<string, string | undefined>, port: number) =>
  env.TARDIS_HOME ?? join(tmpdir(), `tardis-${port}`);
