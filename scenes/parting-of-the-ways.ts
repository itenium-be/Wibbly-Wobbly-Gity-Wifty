import type { Scene } from '../shared/types';
import { blink, forestOfTheDead, runawayBride } from './episodes';

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
    { cmd: "sed -i 's/Ninth/Tenth/' TARDIS.md", caption: 'The Doctor regenerates' },
    {
      cmd: 'git commit -a --amend',
      caption: 'Same episode, new face: the commit gets a new hash',
      accepts: 'git commit',
    },
    { episode: runawayBride },
    { episode: blink },
    { episode: forestOfTheDead },
  ],
};
