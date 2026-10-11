import type { Episode } from '../shared/types';

export const fathersDay: Episode = {
  code: 'S01E08',
  aired: '2005-05-14',
  title: "Father's Day",
  writer: 'Paul Cornell',
  set: { Location: 'London, 7 November 1987', 'Pete Tyler': 'dead' },
};

export const roseSavesPete: Episode = {
  code: '7 November 1987',
  title: 'Rose saves Pete',
  writer: 'Paul Cornell',
  set: { Location: 'London, 7 November 1987', 'Pete Tyler': 'alive' },
  fastForward: true,
};

export const badWolf: Episode = {
  code: 'S01E12',
  aired: '2005-06-11',
  title: 'Bad Wolf',
  writer: 'Russell T Davies',
  set: { Location: 'The Game Station, the year 200,100' },
  event: 'Game Station run by Bad Wolf Corp',
};

export const partingOfTheWays: Episode = {
  code: 'S01E13',
  aired: '2005-06-18',
  title: 'The Parting of the Ways',
  writer: 'Russell T Davies',
  event: 'I am the Bad Wolf. I create myself.',
};

export const riseOfTheCybermen: Episode = {
  code: 'S02E05',
  aired: '2006-05-13',
  title: 'Rise of the Cybermen',
  writer: 'Tom MacRae',
  set: { Companions: ['Rose Tyler', 'Mickey Smith'], Location: "London, Pete's World", 'Pete Tyler': 'alive' },
};

export const doomsday: Episode = {
  code: 'S02E13',
  aired: '2006-07-08',
  title: 'Doomsday',
  writer: 'Russell T Davies',
  set: { Location: 'Bad Wolf Bay, Norway' },
};

export const blink: Episode = {
  code: 'S03E10',
  aired: '2007-06-09',
  title: 'Blink',
  writer: 'Steven Moffat',
  set: { Companions: ['Martha Jones'], Location: 'Wester Drumlins, 2007' },
  event: "An Angel appeared. Don't blink!",
};

export const forestOfTheDead: Episode = {
  code: 'S04E09',
  aired: '2008-06-07',
  title: 'Forest of the Dead',
  writer: 'Steven Moffat',
  set: { Companions: ['Donna Noble'], Location: 'The Library, 51st century' },
  event: 'Who is River Song? Spoilers?',
};

export const stolenEarth: Episode = {
  code: 'S04E12',
  aired: '2008-06-28',
  title: 'The Stolen Earth',
  writer: 'Russell T Davies',
  set: {
    Companions: ['Donna Noble', 'Martha Jones', 'Sarah Jane Smith', 'Captain Jack Harkness'],
    Location: 'The Medusa Cascade',
  },
};
