import { describe, expect, test } from 'bun:test';
import { tokenize } from './command';

describe('tokenize', () => {
  test('splits a plain git command', () => {
    expect(tokenize('git log --oneline')).toEqual({ ok: true, args: ['log', '--oneline'] });
  });

  test('keeps double-quoted text as one argument', () => {
    expect(tokenize('git commit -m "Father\'s Day"')).toEqual({ ok: true, args: ['commit', '-m', "Father's Day"] });
  });

  test('keeps single-quoted text as one argument', () => {
    expect(tokenize("git commit -m 'Bad Wolf'")).toEqual({ ok: true, args: ['commit', '-m', 'Bad Wolf'] });
  });

  test('keeps an empty quoted argument', () => {
    expect(tokenize('git commit -m ""')).toEqual({ ok: true, args: ['commit', '-m', ''] });
  });

  test('collapses surrounding and repeated whitespace', () => {
    expect(tokenize('  git   status  ')).toEqual({ ok: true, args: ['status'] });
  });

  test('rejects an unterminated quote', () => {
    expect(tokenize('git commit -m "Rose')).toEqual({ ok: false, error: 'unterminated "' });
  });

  test('rejects anything but git', () => {
    expect(tokenize('rm -rf /')).toEqual({ ok: false, error: 'only git commands travel in this TARDIS' });
    expect(tokenize('')).toEqual({ ok: false, error: 'only git commands travel in this TARDIS' });
  });
});
