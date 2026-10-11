import type { Scene } from '../shared/types';
import { badWolf, fathersDay, partingOfTheWays, roseSavesPete } from './episodes';

export const fathersDayScene: Scene = {
  id: 'fathers-day',
  episode: 'S01E08',
  title: "Father's Day",
  story: [
    {
      title: 'A Fixed Point in Time',
      text: "7 November 1987. Pete Tyler, Rose's dad, is hit by a car. He dies alone.",
      images: [{ src: '/assets/episodes/fathers-day.jpg' }],
      boxes: [
        { boxes: ['Rose was a baby'] },
        { boxes: ['Now she has a time machine'] },
        { boxes: ['The Reapers come to sterilise the wound'] },
      ],
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
  ],
};
