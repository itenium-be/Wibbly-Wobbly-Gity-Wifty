import type { Scene } from '../shared/types';

export const blinkScene: Scene = {
  id: 'blink',
  episode: 'S03E10',
  title: 'Blink',
  story: [
    {
      title: "Don't Blink",
      text: 'A Weeping Angel got into the TARDIS log.',
      images: [{ src: '/assets/episodes/blink.jpg' }],
      boxes: [
        { boxes: ["Don't blink"] },
        { boxes: ["Don't turn your back"] },
        { boxes: ["Don't look away"] },
        { boxes: ['Which episode let it in?'] },
      ],
    },
  ],
  steps: [
    { cmd: "echo '! grep -q Angel TARDIS.md' > dont-blink.sh", caption: 'Write the test once' },
    { cmd: 'git bisect start', caption: 'Search the timeline' },
    { cmd: 'git bisect bad', caption: 'The Angel is here now' },
    { cmd: 'git bisect good fixed-point/pete', caption: 'No Angels in 1987' },
    { cmd: 'grep Angel TARDIS.md || echo "No Angel"', caption: 'The TARDIS jumped halfway. Any Angels?' },
    { cmd: 'git bisect good', caption: 'Clean: the Angel came later' },
    { cmd: 'git bisect run sh dont-blink.sh', caption: 'Let the test hunt. In real life: git bisect run bun test' },
    { cmd: 'git bisect reset', caption: 'Back to the present' },
    { cmd: "sed -i '/Angel/d' TARDIS.md", caption: 'The Angels look at each other: quantum-locked' },
    { cmd: 'sh dont-blink.sh && echo "Safe"', caption: 'The test passes' },
    { cmd: 'rm dont-blink.sh', caption: "You'd keep the test, so the Angels can't come back" },
    {
      cmd: 'git commit -am "The Angels are quantum-locked"',
      caption: 'Fixed forward: history untouched',
      accepts: 'git commit',
    },
  ],
};
