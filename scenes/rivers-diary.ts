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
    {
      cmd: 'git config --global alias.spoilers "reflog --date=relative --pretty=format:\'%C(magenta)%h%Creset -%C(yellow)%d%Creset %gs %Cgreen(%cd)%C(bold blue)<%an>%Creset\'"',
      caption: "River's diary",
    },
    { cmd: 'git spoilers', caption: 'Spoilers: the diary remembers every jump, even the erased ones' },
    { cmd: 'git checkout f446579', caption: 'Back to the erased timeline where Rose saved Pete' },
    { cmd: 'git switch prime-timeline', caption: 'Back to the real timeline' },
  ],
};
