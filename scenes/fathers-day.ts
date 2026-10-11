import type { Scene } from '../shared/types';
import { fathersDay } from './episodes';

export const fathersDayScene: Scene = {
  id: 'fathers-day',
  episode: 'S01E08',
  title: "Father's Day",
  story: [
    {
      title: 'A Fixed Point in Time',
      text: "Rose's dad Pete was hit by a car on 7 November 1987. Rose goes back and saves him. Two versions of 1987 cannot both be true: the Reapers come to sterilise the wound in time.",
      images: [{ src: '/assets/episodes/fathers-day.jpg' }],
    },
  ],
  steps: [
    { episode: fathersDay },
    { cmd: 'git tag fixed-point/pete', caption: 'A fixed point in time' },
    { cmd: 'git switch -c pete-lives HEAD~1', caption: 'Rose goes back to save him' },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: The Ninth Doctor',
          'Companions:',
          '- Rose Tyler',
          'Location: London, 7 November 1987',
          'Pete Tyler: alive',
          '',
        ].join('\n'),
      },
      caption: 'Rose pushes him out of the way: Pete Tyler: alive',
    },
    { cmd: 'git commit -am "Rose saves Pete"', caption: 'A world where Pete lives', accepts: 'git commit' },
    { cmd: 'git switch prime-timeline', caption: 'Back to the real timeline' },
    { cmd: 'git merge pete-lives', caption: 'dead and alive: a paradox. The Reapers arrive', fails: true },
    { cmd: 'git merge --abort', caption: 'Undo the merge' },
    { cmd: 'git branch -D pete-lives', caption: 'Pete steps in front of the car' },
  ],
};
