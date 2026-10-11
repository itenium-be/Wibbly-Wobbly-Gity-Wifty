import { describe, expect, test } from 'bun:test';
import { parseDiff } from './diff';

const MODIFIED = `diff --git a/TARDIS.md b/TARDIS.md
index 1111111..2222222 100644
--- a/TARDIS.md
+++ b/TARDIS.md
@@ -1,3 +1,3 @@
 # TARDIS log
-Doctor: The Ninth Doctor
+Doctor: The Tenth Doctor
 Companions:
@@ -8,1 +8,2 @@ Events:
 Events:
+- "I am the Bad Wolf. I create myself."
`;

const NEW_AND_DELETED = `diff --git a/dalek.md b/dalek.md
new file mode 100644
index 0000000..3333333
--- /dev/null
+++ b/dalek.md
@@ -0,0 +1 @@
+Exterminate
\\ No newline at end of file
diff --git a/cyberman.md b/cyberman.md
deleted file mode 100644
index 4444444..0000000
--- a/cyberman.md
+++ /dev/null
@@ -1 +0,0 @@
-Delete
`;

describe('parseDiff', () => {
  test('an empty diff has no files', () => {
    expect(parseDiff('')).toEqual([]);
  });

  test('splits a file into added, removed and context lines, without hunk headers', () => {
    expect(parseDiff(MODIFIED)).toEqual([
      {
        path: 'TARDIS.md',
        status: 'modified',
        added: 2,
        removed: 1,
        lines: [
          { kind: 'ctx', text: '# TARDIS log' },
          { kind: 'del', text: 'Doctor: The Ninth Doctor' },
          { kind: 'add', text: 'Doctor: The Tenth Doctor' },
          { kind: 'ctx', text: 'Companions:' },
          { kind: 'ctx', text: 'Events:' },
          { kind: 'add', text: '- "I am the Bad Wolf. I create myself."' },
        ],
      },
    ]);
  });

  test('marks new and deleted files and skips the no-newline marker', () => {
    const files = parseDiff(NEW_AND_DELETED);
    expect(files.map((f) => [f.path, f.status, f.added, f.removed])).toEqual([
      ['dalek.md', 'new', 1, 0],
      ['cyberman.md', 'deleted', 0, 1],
    ]);
    expect(files[0].lines.map((l) => l.kind)).toEqual(['add']);
  });

  test('a removed line that looks like a header is still a removed line', () => {
    const [file] = parseDiff(
      'diff --git a/x.md b/x.md\n--- a/x.md\n+++ b/x.md\n@@ -1,2 +1 @@\n--- a/notes\n+++ b/notes\n',
    );
    expect(file.lines).toEqual([
      { kind: 'del', text: '-- a/notes' },
      { kind: 'add', text: '++ b/notes' },
    ]);
  });
});
