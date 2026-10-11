import type { Scene } from '../shared/types';
import { turnRight } from './episodes';

export const turnLeft: Scene = {
  id: 'turn-left',
  episode: 'S04E11',
  title: 'Turn Left',
  story: [
    {
      title: 'Turn Left',
      text: 'A time beetle makes Donna turn right. She never meets the Doctor, and he dies under the Thames. Rose crosses over from her universe and sends Donna back to turn left. In git: reset, cherry-pick, squash, rebase and rerere.',
      images: [{ src: '/assets/episodes/turn-left.jpg' }],
    },
  ],
  steps: [
    { cmd: 'git reset --hard e09813f', caption: 'A time beetle: everything after The Runaway Bride is gone' },
    { episode: turnRight },
    { cmd: 'git cherry-pick petes-world', caption: 'Rose crosses over from her universe', fails: true },
    {
      edit: {
        'TARDIS.md': [
          '# TARDIS log',
          'Doctor: dead, under the Thames',
          'Companions:',
          '- Rose Tyler',
          'Location: Chiswick',
          'Pete Tyler: dead',
          '',
          'Events:',
          '- Game Station run by Bad Wolf Corp',
          '- I am the Bad Wolf. I create myself.',
          '- Donna turned right. The Doctor died fighting the Racnoss.',
          '- Rose built a dimension cannon to cross back.',
          '',
        ].join('\n'),
      },
      caption: 'Resolve TARDIS.md: Rose, in the dark world',
    },
    { cmd: 'git add TARDIS.md', caption: 'Rose made it', accepts: 'git add' },
    { cmd: 'git cherry-pick --continue', caption: 'Rose finds Donna' },
    { cmd: 'git restore --source e09813f TARDIS.md', caption: 'Donna turns left: back to how it was at Christmas' },
    // Under the title, outside Journey's End's conflict, so rerere's recorded resolution still matches.
    {
      cmd: "sed -i '1a Warning: Bad Wolf. The darkness is coming.' TARDIS.md",
      caption: 'Rose\'s last words: "Bad Wolf"',
    },
    { cmd: 'git commit -am "Turn Left"', caption: 'Turn Left', accepts: 'git commit' },
    { cmd: 'git reset --soft e09813f', caption: 'Fold the dark world up' },
    {
      cmd: 'git commit -m "Turn Left"',
      caption: 'Squashed: the whole dark world is one episode',
      accepts: 'git commit',
    },
    { cmd: 'git show --stat --format=%s', caption: 'All that is left: the warning' },
    { cmd: 'git rebase --onto ebf7702 e09813f', caption: 'Turn Left, after Forest of the Dead' },
    {
      cmd: 'git rebase --rebase-merges --onto prime-timeline ebf7702 8d4bf96',
      caption: 'The real world, replayed on top',
      fails: true,
    },
    { cmd: 'git diff', caption: "Journey's End again: rerere remembers" },
    { cmd: 'git add TARDIS.md', caption: 'Nothing to edit', accepts: 'git add' },
    { cmd: 'git rebase --continue', caption: 'Merged, without touching the editor' },
    { cmd: 'git switch -C prime-timeline', caption: 'Back on the prime timeline' },
  ],
};
