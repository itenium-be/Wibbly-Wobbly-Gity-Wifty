import type { Scene } from '../shared/types';
import { forestOfTheDead, silenceInTheLibrary } from './episodes';

export const riversDiary: Scene = {
  id: 'rivers-diary',
  episode: 'S04E09',
  title: 'Forest of the Dead',
  story: [
    {
      title: "River's Diary",
      text: 'River Song meets the Doctor in the wrong order, and keeps every jump in her diary. Wipe a timeline and the diary still remembers. In git, that is the reflog.',
      images: [],
    },
  ],
  steps: [
    { episode: silenceInTheLibrary },
    { episode: forestOfTheDead },
    { cmd: 'git config --global alias.exterminate "reset --hard"', caption: 'The Daleks have one word for everything' },
    { cmd: 'git exterminate HEAD~2', caption: 'EXTERMINATE! Two episodes wiped from history' },
    { cmd: 'git tardis', caption: 'River is gone. Or is she?' },
    { cmd: 'git config --global alias.spoilers reflog', caption: "River's diary" },
    { cmd: 'git spoilers', caption: 'Spoilers: the diary remembers every jump' },
    { cmd: 'git exterminate HEAD@{1}', caption: 'Nothing is ever truly lost' },
    { cmd: 'git tardis', caption: 'River is back' },
  ],
};
