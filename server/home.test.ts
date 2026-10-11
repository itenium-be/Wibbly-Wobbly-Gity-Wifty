import { describe, expect, test } from 'bun:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tardisHome } from './home';

describe('tardisHome', () => {
  test('each port gets its own home, so concurrent servers never share snapshots', () => {
    expect(tardisHome({}, 3000)).toBe(join(tmpdir(), 'tardis-3000'));
    expect(tardisHome({}, 3001)).toBe(join(tmpdir(), 'tardis-3001'));
  });

  test('TARDIS_HOME wins', () => {
    expect(tardisHome({ TARDIS_HOME: '/srv/tardis' }, 3000)).toBe('/srv/tardis');
  });
});
