import type { Scene } from '../shared/types';
import { blink, forestOfTheDead, partingOfTheWays } from './episodes';

export const partingOfTheWaysScene: Scene = {
  id: 'parting-of-the-ways',
  episode: 'S01E13',
  title: 'The Parting of the Ways',
  story: [
    {
      title: 'Regeneration',
      text: 'The Doctor takes the time vortex out of Rose and it is killing him. Every cell burns and rebuilds: a new face, a new voice, the same man. In git, that is commit --amend.',
      images: [{ src: '/assets/episodes/parting-of-the-ways.jpg' }],
    },
  ],
  steps: [
    { episode: partingOfTheWays },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: The Tenth Doctor',
          'Companions:',
          '- Rose Tyler',
          'Location: The Game Station, the year 200,100',
          'Pete Tyler: dead',
          '',
          'Events:',
          '- The Game Station is run by the Bad Wolf Corporation',
          '- "I am the Bad Wolf. I create myself."',
          '',
        ].join('\n'),
      },
      caption: 'The Doctor regenerates',
    },
    {
      cmd: 'git commit -a --amend --no-edit',
      caption: 'Same episode, new face: the commit gets a new hash',
      accepts: 'git commit',
    },
    { episode: blink },
    { episode: forestOfTheDead },
  ],
};
