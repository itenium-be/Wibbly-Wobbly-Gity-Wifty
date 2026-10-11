// Git redraws progress lines with bare \r; a browser <pre> would show every frame concatenated.
export function collapseCarriageReturns(text: string): string {
  return text
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.split('\r').findLast((frame) => frame !== '') ?? '')
    .join('\n');
}
