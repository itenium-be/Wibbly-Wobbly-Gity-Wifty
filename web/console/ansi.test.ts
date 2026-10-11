import { describe, expect, test } from 'bun:test';
import { parseAnsi } from './ansi';

const ESC = '\x1b';

describe('parseAnsi', () => {
  test('plain text is one unstyled segment', () => {
    expect(parseAnsi('Rose\n')).toEqual([{ text: 'Rose\n', classes: [] }]);
  });

  test('a colour runs until the reset', () => {
    expect(parseAnsi(`${ESC}[35mabfb21f${ESC}[m - Rose`)).toEqual([
      { text: 'abfb21f', classes: ['ansi-35'] },
      { text: ' - Rose', classes: [] },
    ]);
  });

  test('bold and colour combine in one sequence', () => {
    expect(parseAnsi(`${ESC}[1;34m<The Doctor>${ESC}[0m`)).toEqual([
      { text: '<The Doctor>', classes: ['ansi-bold', 'ansi-34'] },
    ]);
  });

  test('a new colour replaces the old one, bold stays', () => {
    expect(parseAnsi(`${ESC}[1m${ESC}[31ma${ESC}[32mb`)).toEqual([
      { text: 'a', classes: ['ansi-bold', 'ansi-31'] },
      { text: 'b', classes: ['ansi-bold', 'ansi-32'] },
    ]);
  });

  test('39 drops the colour, 22 drops bold', () => {
    expect(parseAnsi(`${ESC}[1;31ma${ESC}[39mb${ESC}[22mc`)).toEqual([
      { text: 'a', classes: ['ansi-bold', 'ansi-31'] },
      { text: 'b', classes: ['ansi-bold'] },
      { text: 'c', classes: [] },
    ]);
  });

  test('bright colours map onto their base colour', () => {
    expect(parseAnsi(`${ESC}[92mok`)).toEqual([{ text: 'ok', classes: ['ansi-32'] }]);
  });
});
