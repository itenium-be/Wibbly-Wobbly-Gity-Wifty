/** The file a typed `git blame` is about: its last argument, or the one after `--`. */
export function blameTarget(cmd: string): string | undefined {
  const args = (cmd.split('|')[0] ?? '').trim().split(/\s+/);
  if (args[0] !== 'git' || args[1] !== 'blame') return undefined;
  const rest = args.slice(2);
  const dashes = rest.indexOf('--');
  const path = dashes >= 0 ? rest[dashes + 1] : rest.at(-1);
  if (!path || path.startsWith('-')) return undefined;
  return path.replace(/^(["'])(.*)\1$/, '$2');
}
