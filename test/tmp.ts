import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const tmp = () => mkdtemp(join(tmpdir(), 'tardis-test-'));
