import type { Scene } from '../shared/types';

export const riversDiary: Scene = {
  id: 'rivers-diary',
  episode: 'S04E09',
  title: 'Forest of the Dead',
  story: [
    {
      title: "River's Diary",
      text: 'River Song meets the Doctor in the wrong order, and keeps every jump in her diary. Wipe a timeline and the diary still remembers. In git, that is the reflog.',
      images: [{ src: '/assets/episodes/rivers-diary.jpg' }],
    },
  ],
  steps: [
    { cmd: 'git config --global alias.exterminate "reset --hard"', caption: 'The Daleks have one word for everything' },
    { cmd: 'git exterminate HEAD~1', caption: "EXTERMINATE! Journey's End wiped from history" },
    { cmd: 'git config --global alias.spoilers reflog', caption: "River's diary" },
    { cmd: 'git spoilers', caption: 'Spoilers: the diary remembers every jump' },
    { cmd: 'git exterminate HEAD@{1}', caption: 'Nothing is ever truly lost' },
  ],
};
