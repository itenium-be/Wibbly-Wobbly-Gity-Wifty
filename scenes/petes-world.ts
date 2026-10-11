import type { Scene } from '../shared/types';
import { doomsday, riseOfTheCybermen, turnLeft } from './episodes';

export const petesWorld: Scene = {
  id: 'petes-world',
  episode: 'S02E05',
  title: 'Rise of the Cybermen',
  story: [
    {
      title: "Pete's World",
      text: "The TARDIS falls into a parallel universe: zeppelins over London, Cybermen in the streets, and Rose's dad Pete is still alive. Same past, different future. In git, that is a branch.",
      images: [],
    },
  ],
  steps: [
    { cmd: 'git branch petes-world', caption: 'A parallel universe: same past, different future' },
    { cmd: 'git branch', caption: 'Two universes. The * is where the TARDIS is' },
    { cmd: 'git switch petes-world', caption: 'Cross the void' },
    { episode: riseOfTheCybermen },
    { episode: doomsday },
    { cmd: 'git switch prime-timeline', caption: 'Back to our universe: no Rose here' },
    { episode: turnLeft },
    {
      cmd: 'git config --global alias.tardis "log --oneline --graph --all"',
      caption: "It's bigger on the inside",
    },
    { cmd: 'git tardis', caption: 'Two universes, one shared past' },
  ],
};
