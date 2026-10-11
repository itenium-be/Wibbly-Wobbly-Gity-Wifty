import type { Scene } from '../shared/types';
import { stolenEarth } from './episodes';

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
    { episode: stolenEarth },
    { cmd: 'git merge petes-world', caption: 'The universes collide', fails: true },
    { cmd: 'git st', caption: 'Both universes changed the same lines' },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: The Tenth Doctor',
          'Companion: Rose Tyler, Donna Noble, Martha Jones, Sarah Jane Smith, Captain Jack, Mickey Smith',
          'Location: The Medusa Cascade',
          '- The Moxx of Balhoon calls it "the Bad Wolf scenario"',
          '- Someone sprayed Bad Wolf on the TARDIS',
          "- Van Statten's helicopter is called Bad Wolf One",
          "- Rose is stranded in Pete's World, on Bad Wolf Bay",
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
    { cmd: 'git tardis', caption: 'Both timelines lead here' },
    { cmd: 'git branch -d petes-world', caption: 'Close the void' },
  ],
};
