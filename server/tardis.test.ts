import { describe, expect, test } from 'bun:test';
import { applyEpisode } from './tardis';

const log = '# TARDIS log\nDoctor: The Ninth Doctor\nCompanions:\n- Rose Tyler\nLocation: London, 2005\n';
const events = '\nEvents:\n- Bad Wolf graffiti\n';

describe('applyEpisode', () => {
  test('replaces a field in place', () => {
    expect(applyEpisode(log, { set: { Location: 'Platform One' } })).toBe(
      '# TARDIS log\nDoctor: The Ninth Doctor\nCompanions:\n- Rose Tyler\nLocation: Platform One\n',
    );
  });

  test('adds a new field after the last field, before the events', () => {
    expect(applyEpisode(`${log}${events}`, { set: { 'Pete Tyler': 'dead' } })).toBe(
      `${log}Pete Tyler: dead\n${events}`,
    );
  });

  test('replaces a list field in place, one item per line', () => {
    expect(applyEpisode(log, { set: { Companions: ['Rose Tyler', 'Mickey Smith'] } })).toBe(
      '# TARDIS log\nDoctor: The Ninth Doctor\nCompanions:\n- Rose Tyler\n- Mickey Smith\nLocation: London, 2005\n',
    );
  });

  test('adds a new list field after the last field', () => {
    expect(applyEpisode(log, { set: { Enemies: ['Daleks'] } })).toBe(`${log}Enemies:\n- Daleks\n`);
  });

  test('starts the events after a blank line', () => {
    expect(applyEpisode(log, { event: 'Bad Wolf graffiti' })).toBe(`${log}${events}`);
  });

  test('appends an event to the events', () => {
    expect(applyEpisode(`${log}${events}`, { event: 'Bad Wolf again' })).toBe(`${log}${events}- Bad Wolf again\n`);
  });

  test('changes nothing without set or event', () => {
    expect(applyEpisode(log, {})).toBe(log);
  });
});
