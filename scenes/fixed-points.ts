import type { Scene } from '../shared/types';

import {
  aliensOfLondon,
  christmasInvasion,
  dalek,
  firesOfPompeii,
  partnersInCrime,
  planetOfTheOod,
  sontaranStratagem,
} from './episodes';

export const fixedPoints: Scene = {
  id: 'fixed-points',
  episode: 'S04E02',
  title: 'The Fires of Pompeii',
  story: [
    {
      title: 'Fixed Points in Time',
      text: 'Some events are fixed: Pompeii must burn. The Doctor can visit, look around and leave, but he cannot change them. In git, that is a tag.',
      images: [{ src: '/assets/episodes/pompeii.jpg' }],
    },
  ],
  steps: [
    { episode: aliensOfLondon },
    { episode: dalek },
    { episode: christmasInvasion },
    { episode: partnersInCrime },
    { episode: firesOfPompeii },
    { cmd: 'git tag fixed-point/pompeii', caption: 'Pompeii must burn: mark it as a fixed point' },
    { episode: planetOfTheOod },
    { episode: sontaranStratagem },
    { cmd: 'git log --oneline', caption: 'The timeline so far' },
    {
      cmd: 'git checkout fixed-point/pompeii',
      caption: 'Travel back. Look around, but you are on no timeline: detached HEAD',
    },
    { cmd: 'cat TARDIS.md', caption: 'The TARDIS log, as it was in Pompeii' },
    { cmd: 'git switch prime-timeline', caption: 'Back to the present' },
  ],
};
