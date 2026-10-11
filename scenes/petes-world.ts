import type { Scene } from '../shared/types';
import { doomsday, riseOfTheCybermen } from './episodes';

export const petesWorld: Scene = {
  id: 'petes-world',
  episode: 'S02E05',
  title: 'Rise of the Cybermen',
  story: [
    {
      title: "Pete's World",
      text: "The TARDIS falls into a parallel universe: zeppelins over London, Cybermen in the streets, and Rose's dad Pete is alive. Same past, different future.",
      images: [{ src: '/assets/episodes/petes-world.jpg' }],
    },
  ],
  steps: [
    { cmd: 'git switch -c petes-world', caption: 'A parallel universe: same past, different future' },
    { episode: riseOfTheCybermen },
    { episode: doomsday },
    { cmd: 'git switch prime-timeline', caption: 'Back to our universe: Rose stays behind' },
  ],
};
