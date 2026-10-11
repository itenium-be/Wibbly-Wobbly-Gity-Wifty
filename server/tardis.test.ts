import { describe, expect, test } from 'bun:test';
import { applyEpisode } from './tardis';

const log = '# TARDIS log\nDoctor: The Ninth Doctor\nCompanion: Rose Tyler\nLocation: London, 2005\n';

describe('applyEpisode', () => {
  test('replaces a field in place', () => {
    expect(applyEpisode(log, { set: { Location: 'Platform One' } })).toBe(
      '# TARDIS log\nDoctor: The Ninth Doctor\nCompanion: Rose Tyler\nLocation: Platform One\n',
    );
  });

  test('adds a new field after the last field, before notes', () => {
    const noted = `${log}- Bad Wolf graffiti\n`;
    expect(applyEpisode(noted, { set: { 'Pete Tyler': 'dead' } })).toBe(
      `${log}Pete Tyler: dead\n- Bad Wolf graffiti\n`,
    );
  });

  test('appends a note', () => {
    expect(applyEpisode(log, { note: '- Bad Wolf graffiti' })).toBe(`${log}- Bad Wolf graffiti\n`);
  });

  test('changes nothing without set or note', () => {
    expect(applyEpisode(log, {})).toBe(log);
  });
});
