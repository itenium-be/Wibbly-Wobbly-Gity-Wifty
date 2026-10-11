import type { Scene } from '../shared/types';

export const outro: Scene = {
  id: 'outro',
  episode: 'S04E18',
  title: 'The End of Time',
  story: [
    {
      title: 'Wibbly Wobbly Gity Wifty',
      text: "Rose: init, add, commit. Father's Day: tag, branch, merge --abort. Journey's End: merge. Blink: bisect. River's diary: reflog. Bad Wolf: log -S, blame. Turn Left: reset, cherry-pick, squash, rebase, rerere.",
      images: [{ src: '/assets/episodes/end-of-time.jpg' }],
    },
  ],
  steps: [{ cmd: 'git log --oneline --graph --all', caption: 'The whole timeline' }],
};
