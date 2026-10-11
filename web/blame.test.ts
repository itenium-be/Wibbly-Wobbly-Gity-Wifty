import { describe, expect, test } from 'bun:test';
import { blameTarget } from './blame';

describe('blameTarget', () => {
  test.each([
    ['git blame TARDIS.md', 'TARDIS.md'],
    ['  git   blame   TARDIS.md ', 'TARDIS.md'],
    ['git blame -L 1,5 episodes/rose.md', 'episodes/rose.md'],
    ['git blame HEAD~1 -- TARDIS.md', 'TARDIS.md'],
    ['git blame "TARDIS.md"', 'TARDIS.md'],
    ['git blame TARDIS.md | head -3', 'TARDIS.md'],
  ])('%s opens %s', (cmd, path) => {
    expect(blameTarget(cmd)).toBe(path);
  });

  test.each(['git log', 'git blame', 'git blame -s', 'echo git blame TARDIS.md'])('%s opens nothing', (cmd) => {
    expect(blameTarget(cmd)).toBeUndefined();
  });
});
