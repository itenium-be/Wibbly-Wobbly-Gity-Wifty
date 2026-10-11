export type Segment = { text: string; classes: string[] };

// Only what git emits: SGR bold and the 8 colours (bright ones folded in); anything else is dropped.
// biome-ignore lint/suspicious/noControlCharactersInRegex: ESC is the point.
const SGR = /\x1b\[([0-9;]*)m/;

export function parseAnsi(text: string): Segment[] {
  const parts = text.split(new RegExp(SGR, 'g'));
  const segments: Segment[] = [];
  let bold = false;
  let colour: number | null = null;
  for (const [i, part] of parts.entries()) {
    if (i % 2 === 0) {
      if (part)
        segments.push({ text: part, classes: [...(bold ? ['ansi-bold'] : []), ...(colour ? [`ansi-${colour}`] : [])] });
      continue;
    }
    for (const code of (part || '0').split(';').map(Number)) {
      if (code === 0) [bold, colour] = [false, null];
      else if (code === 1) bold = true;
      else if (code === 22) bold = false;
      else if (code === 39) colour = null;
      else if (code >= 30 && code <= 37) colour = code;
      else if (code >= 90 && code <= 97) colour = code - 60;
    }
  }
  return segments;
}
