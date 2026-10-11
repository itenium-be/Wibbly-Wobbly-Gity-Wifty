import type { Scene } from '../shared/types';
import { badWolf, blink, fathersDay, forestOfTheDead, partingOfTheWays, roseSavesPete } from './episodes';

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
    { episode: roseSavesPete },
    { cmd: 'git switch prime-timeline', caption: 'Back to the real timeline' },
    { cmd: 'git merge pete-lives', caption: 'dead and alive: a paradox. The Reapers arrive', fails: true },
    { cmd: 'git merge --abort', caption: 'Undo the merge' },
    { cmd: 'git branch -D pete-lives', caption: 'Pete steps in front of the car' },
    { episode: badWolf },
    { episode: partingOfTheWays },
    { episode: blink },
    { episode: forestOfTheDead },
  ],
};
