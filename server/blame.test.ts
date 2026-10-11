import { describe, expect, test } from 'bun:test';
import { parseBlame } from './blame';

const ROSE = 'e3df6a4a00000000000000000000000000000000';
const WOLF = 'e9a2e87f00000000000000000000000000000000';

const PORCELAIN = `${ROSE} 1 1 1
author The Doctor
author-mail <doctor@tardis.gallifrey>
author-time 1111863600
author-tz +0000
committer The Doctor
committer-mail <doctor@tardis.gallifrey>
committer-time 1111863600
committer-tz +0000
summary Rose
boundary
filename TARDIS.md
\t# TARDIS log
${WOLF} 2 2 2
author Russell T Davies
author-mail <russell.t.davies@bbc.co.uk>
author-time 1118516400
author-tz +0000
committer The Doctor
committer-mail <doctor@tardis.gallifrey>
committer-time 1118516400
committer-tz +0000
summary Bad Wolf
previous ${ROSE} TARDIS.md
filename TARDIS.md
\tEvents:
${WOLF} 3 3
\t- Game Station run by Bad Wolf Corp
${ROSE} 4 4 1
\t
`;

describe('parseBlame', () => {
  test('groups consecutive lines of one commit, and repeats a commit that comes back later', () => {
    expect(parseBlame(PORCELAIN)).toEqual([
      { hash: ROSE, author: 'The Doctor', date: '2005-03-26', summary: 'Rose', lines: ['# TARDIS log'] },
      {
        hash: WOLF,
        author: 'Russell T Davies',
        date: '2005-06-11',
        summary: 'Bad Wolf',
        lines: ['Events:', '- Game Station run by Bad Wolf Corp'],
      },
      { hash: ROSE, author: 'The Doctor', date: '2005-03-26', summary: 'Rose', lines: [''] },
    ]);
  });

  test('an empty file has no hunks', () => {
    expect(parseBlame('')).toEqual([]);
  });
});
