import type { Scene } from '../shared/types';
import { blink, forestOfTheDead } from './episodes';

export const journeysEnd: Scene = {
  id: 'journeys-end',
  episode: 'S04E13',
  title: "Journey's End",
  story: [
    {
      title: 'Universes Collide',
      text: 'Davros steals the Earth. Every companion comes back, Rose crosses over from her universe, and two timelines have to become one. In git, that is a merge.',
      images: [],
    },
  ],
  steps: [
    { episode: blink },
    { episode: forestOfTheDead },
    { cmd: 'git merge petes-world', caption: 'The universes collide', fails: true },
    { cmd: 'git st', caption: 'Both universes changed the same lines' },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: The Tenth Doctor',
          'Companions:',
          '- Rose Tyler',
          '- Donna Noble',
          '- Martha Jones',
          '- Sarah Jane Smith',
          '- Captain Jack',
          '- Mickey Smith',
          'Location: Bad Wolf Bay, Norway',
          "Pete Tyler: alive, in Pete's World",
          '',
          'Events:',
          '- The Game Station is run by the Bad Wolf Corporation',
          '- "I am the Bad Wolf. I create myself."',
          "- A Weeping Angel got into the log. Don't blink.",
          '- River Song knows my name. Spoilers.',
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
