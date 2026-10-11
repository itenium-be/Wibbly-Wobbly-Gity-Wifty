import type { Scene } from '../shared/types';

export const riversDiary: Scene = {
  id: 'rivers-diary',
  episode: 'S04E09',
  title: 'Forest of the Dead',
  story: [
    {
      title: "River's Diary",
      text: 'River Song meets the Doctor in the wrong order.',
      images: [{ src: '/assets/episodes/rivers-diary.jpg' }],
      boxes: [
        { boxes: ['His first day is her last'] },
        { boxes: ['Every jump goes in her diary'] },
        { boxes: ['Spoilers!'] },
      ],
    },
  ],
  steps: [
    {
      cmd: 'git config --global alias.spoilers "reflog --date=relative --pretty=format:\'%C(magenta)%h%Creset -%C(yellow)%d%Creset %gs %Cgreen(%cd)%C(bold blue)<%an>%Creset\'"',
      caption: "River's diary",
    },
    { cmd: 'git spoilers', caption: 'Spoilers: the diary remembers every jump, even the erased ones' },
    { cmd: 'git branch pete-lives abfb21f', caption: 'The timeline where Rose saved Pete is back' },
  ],
};
