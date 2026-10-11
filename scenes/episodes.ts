import type { Episode } from '../shared/types';

export const fathersDay: Episode = {
  code: 'S01E08',
  title: "Father's Day",
  set: { Location: 'London, 7 November 1987', 'Pete Tyler': 'dead' },
};

export const badWolf: Episode = {
  code: 'S01E12',
  title: 'Bad Wolf',
  set: { Location: 'The Game Station, the year 200,100' },
  event: 'The Game Station is run by the Bad Wolf Corporation',
};

export const partingOfTheWays: Episode = {
  code: 'S01E13',
  title: 'The Parting of the Ways',
  set: { Doctor: 'The Tenth Doctor' },
  event: '"I am the Bad Wolf. I create myself."',
};

export const riseOfTheCybermen: Episode = {
  code: 'S02E05',
  title: 'Rise of the Cybermen',
  set: { Companions: ['Rose Tyler', 'Mickey Smith'], Location: "London, Pete's World", 'Pete Tyler': 'alive' },
};

export const doomsday: Episode = {
  code: 'S02E13',
  title: 'Doomsday',
  set: { Location: 'Bad Wolf Bay, Norway' },
};

export const blink: Episode = {
  code: 'S03E10',
  title: 'Blink',
  set: { Companions: ['Martha Jones'], Location: 'Wester Drumlins, 2007' },
  event: "A Weeping Angel got into the log. Don't blink.",
};

export const forestOfTheDead: Episode = {
  code: 'S04E09',
  title: 'Forest of the Dead',
  set: { Companions: ['Donna Noble'], Location: 'The Library, 51st century' },
  event: 'River Song knows my name. Spoilers.',
};
