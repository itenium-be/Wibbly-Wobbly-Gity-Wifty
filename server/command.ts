export type Parsed = { ok: true; args: string[] } | { ok: false; error: string };

export function tokenize(input: string): Parsed {
  const tokens: string[] = [];
  let current = '';
  let inToken = false;
  let quote: string | null = null;

  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
    } else if (/\s/.test(ch)) {
      if (inToken) tokens.push(current);
      current = '';
      inToken = false;
    } else {
      current += ch;
      inToken = true;
    }
  }

  if (quote) return { ok: false, error: `unterminated ${quote}` };
  if (inToken) tokens.push(current);
  if (tokens[0] !== 'git') return { ok: false, error: 'only git commands travel in this TARDIS' };
  return { ok: true, args: tokens.slice(1) };
}
