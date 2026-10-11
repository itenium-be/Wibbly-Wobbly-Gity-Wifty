import type { Scene } from '../shared/types';
import { blink, forestOfTheDead } from './episodes';

export const partingOfTheWaysScene: Scene = {
  id: 'parting-of-the-ways',
  episode: 'S01E13',
  title: 'The Parting of the Ways',
  story: [
    {
      title: 'Regeneration',
      text: 'The Doctor takes the time vortex out of Rose and it is killing him.',
      reveal: true,
      images: [
        { src: '/assets/episodes/parting-of-the-ways.jpg', stamp: 'DEAD', stampNote: '(Creative Differences)' },
        { src: '/assets/episodes/parting-of-the-ways-tennant.jpg' },
      ],
    },
  ],
  steps: [
    { cmd: "sed -i 's/Ninth/Tenth/' TARDIS.md", caption: 'The Doctor regenerates' },
    {
      cmd: 'git commit -a --amend',
      caption: 'Same episode, new face: the commit gets a new hash',
      accepts: 'git commit',
    },
    { episode: blink },
    { episode: forestOfTheDead },
  ],
};
