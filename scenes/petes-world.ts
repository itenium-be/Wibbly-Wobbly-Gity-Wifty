import type { Scene } from '../shared/types';
import { dimensionCannon, doomsday, riseOfTheCybermen, stolenEarth } from './episodes';

export const petesWorld: Scene = {
  id: 'petes-world',
  episode: 'S02E05',
  title: 'Rise of the Cybermen',
  story: [
    {
      title: "Pete's World",
      text: 'The TARDIS falls through a crack into a parallel universe.',
      images: [{ src: '/assets/episodes/petes-world.jpg' }],
      boxes: [
        { boxes: ['Zeppelins over London'] },
        { boxes: ['Cybermen in the streets'] },
        { boxes: ["Rose's dad is alive"] },
      ],
    },
  ],
  steps: [
    {
      cmd: 'git switch -c petes-world HEAD~3',
      caption: 'A parallel universe, split off after The Parting of the Ways',
    },
    { episode: riseOfTheCybermen },
    { episode: doomsday },
    { episode: dimensionCannon },
    { cmd: 'git switch prime-timeline', caption: 'Back to our universe: Rose stays behind' },
    { episode: stolenEarth },
  ],
};
