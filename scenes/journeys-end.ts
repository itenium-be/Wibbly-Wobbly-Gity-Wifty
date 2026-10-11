import type { Scene } from '../shared/types';

export const journeysEnd: Scene = {
  id: 'journeys-end',
  episode: 'S04E13',
  title: "Journey's End",
  story: [
    {
      title: 'Universes Collide',
      text: 'Davros steals the Earth. Every companion comes back, Rose crosses over from her universe, and two timelines have to become one. In git, that is a merge.',
      images: [{ src: '/assets/episodes/journeys-end.jpg' }],
    },
  ],
  steps: [
    { cmd: 'git merge petes-world', caption: 'The universes collide', fails: true },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: The Tenth Doctor',
          'Companions:',
          '- Donna Noble',
          '- Martha Jones',
          '- Sarah Jane Smith',
          '- Captain Jack Harkness',
          '- Rose Tyler',
          '- Mickey Smith',
          'Location: Bad Wolf Bay, Norway',
          "Pete Tyler: alive, in Pete's World",
          '',
          'Events:',
          '- Game Station run by Bad Wolf Corp',
          '- I am the Bad Wolf. I create myself.',
          "- A Weeping Angel appeared. Don't blink.",
          '- Who is River Song? Spoilers?',
          '',
        ].join('\n'),
      },
      caption: 'Resolve TARDIS.md: everyone is on board',
    },
    {
      cmd: 'git commit -am "Journey\'s End"',
      caption: 'Two parents: the universes are one again',
      accepts: 'git commit',
    },
    { cmd: 'git branch -d petes-world', caption: 'Close the void' },
  ],
};
