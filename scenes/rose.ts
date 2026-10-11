import type { Scene } from '../shared/types';

export const rose: Scene = {
  id: 'rose',
  episode: 'S01E01',
  title: 'Rose',
  story: [
    {
      title: 'The Doctor',
      text: 'This is the Doctor. He travels through time on fun adventures, where he lets his companions do the dirty work so he can keep his hands clean and his conscience clear.',
      images: [
        { src: '/assets/doctors/09-eccleston.jpg', name: 'The Ninth Doctor' },
        { src: '/assets/doctors/10-tennant.jpg', name: 'The Tenth Doctor' },
        { src: '/assets/doctors/11-smith.jpg', name: 'The Eleventh Doctor' },
        { src: '/assets/doctors/12-capaldi.jpg', name: 'The Twelfth Doctor' },
        { src: '/assets/doctors/13-whittaker.jpg', name: 'The Thirteenth Doctor' },
        { src: '/assets/doctors/14-tennant.jpg', name: 'The Fourteenth Doctor' },
        { src: '/assets/doctors/15-gatwa.jpg', name: 'The Fifteenth Doctor' },
      ],
    },
    {
      title: 'The TARDIS',
      text: 'This is the TARDIS, his time machine. Wherever it lands is where we are in the timeline.',
      images: [{ src: '/assets/tardis.jpg' }],
    },
    {
      title: 'The Companions',
      text: 'These are the companions of the Doctor. They travel with him on his adventures, until they get themselves killed (or worse).',
      images: [
        { src: '/assets/companions/rose.jpg', name: 'Rose Tyler', fate: 'TRAPPED IN A PARALLEL UNIVERSE' },
        { src: '/assets/companions/donna.jpg', name: 'Donna Noble', fate: 'MEMORY WIPED' },
        { src: '/assets/companions/amy-rory.jpg', name: 'Amy & Rory', fate: 'ZAPPED INTO 1938 BY A WEEPING ANGEL' },
        { src: '/assets/companions/clara.jpg', name: 'Clara Oswald', fate: 'DEAD (EVENTUALLY)' },
        { src: '/assets/companions/bill.jpg', name: 'Bill Potts', fate: 'CONVERTED INTO A CYBERMAN' },
        { src: '/assets/companions/river.jpg', name: 'River Song', fate: 'UPLOADED INTO A LIBRARY COMPUTER' },
      ],
    },
    {
      title: 'Rose',
      text: 'Series 1, episode 1: Rose Tyler meets the Doctor. The first event in our timeline, so: the first commit.',
      images: [{ src: '/assets/episodes/rose.jpg' }],
    },
  ],
  build: [{ write: { 'episodes/rose.md': '# Rose\n' } }],
  steps: [
    { cmd: 'git init', caption: 'Every timeline has to start somewhere' },
    { cmd: 'git add .', caption: 'Stage the episode' },
    { cmd: 'git commit -m "Rose"', caption: 'S01E01: the first event in the timeline' },
    { cmd: 'git log', caption: 'HEAD: where the TARDIS is right now' },
  ],
};
