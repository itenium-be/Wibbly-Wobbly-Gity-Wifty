import type { Scene } from '../shared/types';
import { dimensionCannon, turnRight } from './episodes';

export const turnLeft: Scene = {
  id: 'turn-left',
  episode: 'S04E11',
  title: 'Turn Left',
  story: [
    {
      title: 'Turn Left',
      text: 'A time beetle makes Donna turn right.',
      images: [{ src: '/assets/episodes/turn-left.jpg' }],
      boxes: [
        { boxes: ['She Never Meets the Doctor'] },
        { boxes: ['He Dies Under the Thames'] },
        { boxes: ['Rose Crosses Over'] },
      ],
    },
  ],
  steps: [
    { cmd: 'git reset --hard e09813f', caption: 'A time beetle: everything after The Runaway Bride is gone' },
    { episode: turnRight },
    { cmd: 'git switch petes-world', caption: "Meanwhile, in Pete's World: the stars are going out" },
    { episode: dimensionCannon },
    { cmd: 'git switch prime-timeline', caption: 'Back to the dark world' },
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
    { cmd: 'git show', caption: 'All that is left: the warning' },
    { cmd: 'git rebase --onto ebf7702 e09813f', caption: 'Turn Left, after Forest of the Dead (ebf7702)' },
    {
      cmd: 'git rebase --rebase-merges --onto prime-timeline ebf7702 4e05f6c',
      caption: 'The real world, replayed on top',
      fails: true,
    },
    { cmd: 'git diff', caption: "Journey's End again: rerere remembers" },
    { cmd: 'git add TARDIS.md', caption: 'Nothing to edit', accepts: 'git add' },
    { cmd: 'git rebase --continue', caption: 'Merged, without touching the editor' },
    { cmd: 'git switch -C prime-timeline', caption: 'Back on the prime timeline' },
  ],
};
