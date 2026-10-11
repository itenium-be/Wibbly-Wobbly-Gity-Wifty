import type { Scene } from '../shared/types';
import { blink, boomTown, emptyChild, longGame, soundOfDrums, utopia } from './episodes';

export const blinkScene: Scene = {
  id: 'blink',
  episode: 'S03E10',
  title: 'Blink',
  story: [
    {
      title: "Don't Blink",
      text: 'The Weeping Angels only move when nobody is looking. One got into the TARDIS log somewhere along the way. Which episode let it in? In git, that is a bisect.',
      images: [],
    },
  ],
  steps: [
    { episode: longGame },
    { episode: emptyChild },
    { episode: blink },
    { episode: boomTown },
    { episode: utopia },
    { episode: soundOfDrums },
    { cmd: 'cat TARDIS.md', caption: "There's an Angel in the log. Don't blink." },
    { cmd: 'git bisect start', caption: 'Search the timeline' },
    { cmd: 'git bisect bad', caption: 'The Angel is here now' },
    { cmd: 'git bisect good fixed-point/pompeii', caption: 'No Angels in Pompeii' },
    { cmd: 'grep Angel TARDIS.md', caption: 'The TARDIS jumped halfway. Any Angels?', fails: true },
    { cmd: 'git bisect good', caption: 'Clean: the Angel came later' },
    {
      cmd: `git bisect run sh -c '! grep -q "Weeping Angel" TARDIS.md'`,
      caption: 'Let the TARDIS do the rest',
    },
    { cmd: 'git bisect reset', caption: 'Back to the present' },
  ],
};
