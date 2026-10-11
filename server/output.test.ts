import { describe, expect, test } from 'bun:test';
import { collapseCarriageReturns } from './output';

describe('collapseCarriageReturns', () => {
  test('keeps only the text after the last \\r on each line', () => {
    expect(collapseCarriageReturns('Rebasing (1/3)\rRebasing (2/3)\rRebasing (3/3)\nDone\n')).toBe(
      'Rebasing (3/3)\nDone\n',
    );
  });

  test('treats \\r\\n as a newline', () => {
    expect(collapseCarriageReturns('a\r\nb\r\n')).toBe('a\nb\n');
  });

  test('a trailing \\r does not erase the line', () => {
    expect(collapseCarriageReturns('one\rtwo\r')).toBe('two');
  });

  test('leaves output without \\r untouched', () => {
    expect(collapseCarriageReturns('x\ny\n')).toBe('x\ny\n');
  });
});
