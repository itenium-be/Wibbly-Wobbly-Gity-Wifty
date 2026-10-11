import type { Scene } from '../shared/types';

export const badWolfScene: Scene = {
  id: 'bad-wolf',
  episode: 'S01E12',
  title: 'Bad Wolf',
  story: [
    {
      title: 'Bad Wolf',
      text: 'Two words, scattered through time and space.',
      images: [{ src: '/assets/episodes/bad-wolf.jpg' }],
      boxes: [{ boxes: ['Following the Doctor Everywhere'] }, { boxes: ['Who Wrote Them?'] }, { boxes: ['And When?'] }],
    },
  ],
  steps: [
    { cmd: 'git log --grep "Wolf" --oneline', caption: 'Which episode is called Bad Wolf?' },
    { cmd: 'git log -S "Bad Wolf" --oneline', caption: 'Every episode that left the message' },
    { cmd: 'git blame TARDIS.md', caption: 'Who wrote each line, and when' },
  ],
};
