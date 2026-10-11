import type { Scene } from '../shared/types';

export const outro: Scene = {
  id: 'outro',
  episode: 'S04E18',
  title: 'The End of Time',
  story: [
    {
      title: 'Wibbly Wobbly Gity Wifty',
      text: "Rose: init, add, commit. Father's Day: tag, branch, merge --abort. Regeneration: commit --amend. Pete's World: switch -c. Journey's End: merge. Blink: bisect. River's diary: reflog. Bad Wolf: log -S, blame.",
      images: [{ src: '/assets/episodes/end-of-time.jpg' }],
      boxes: [{ boxes: ["I Don't Want to Go"] }, { boxes: ['Questions?'] }],
    },
  ],
  steps: [{ cmd: 'git log --oneline --graph --all', caption: 'The whole timeline' }],
};
