import { expect, test } from 'bun:test';

test('dom and native fetch primitives are both available', () => {
  expect(document.createElement('div').tagName).toBe('DIV');
  expect(typeof Response.json).toBe('function');
});
