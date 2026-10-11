import type { Scene } from '../shared/types';

const episodes = [
  'Rose',
  'Dalek',
  "Father's Day",
  'The Empty Child',
  'Doomsday',
  'Smith and Jones',
  'Blink',
  'Partners in Crime',
  'The Fires of Pompeii',
  'Planet of the Ood',
  'The Sontaran Stratagem',
];

export const fixedPoints: Scene = {
  id: 'fixed-points',
  episode: 'S04E02',
  title: 'The Fires of Pompeii',
  story: [
    {
      title: 'Fixed Points in Time',
      text: 'Some events are fixed: Pompeii must burn. The Doctor can visit, look around and leave, but he cannot change them. In git, that is a tag.',
      images: [{ src: '/assets/episodes/pompeii.jpg' }],
    },
  ],
  build: [{ git: ['init', '-q'] }, ...episodes.map((commit) => ({ commit }))],
  steps: [
    { cmd: 'git log --oneline', caption: 'The timeline so far: one event per episode' },
    { cmd: 'git tag fixed-point/pompeii HEAD~2', caption: 'Pompeii must burn: mark it as a fixed point' },
    {
      cmd: 'git checkout fixed-point/pompeii',
      caption: 'Travel back. Look around, but you are on no timeline: detached HEAD',
    },
    { cmd: 'git switch prime-timeline', caption: 'Back to the present' },
  ],
};
