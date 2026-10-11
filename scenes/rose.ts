import type { Scene } from '../shared/types';

export const rose: Scene = {
  id: 'rose',
  episode: 'S01E01',
  title: 'Rose',
  story: [
    {
      title: 'The Show',
      text: 'Doctor Who: BBC science fiction since 1963. Cancelled in 1989, revived in 2005 with "Rose". The longest-running sci-fi show in the world.',
      images: [{ src: '/assets/logo.jpg' }],
      boxes: [{ title: 'Choose your timeline', boxes: ['SPOILERS', 'MINIMAL SPOILERS'] }],
    },
    {
      title: 'The Doctor',
      text: 'This is the Doctor. He travels through time and space.',
      boxes: [
        { boxes: ['Fun Adventures'] },
        { boxes: ['Companions Do the Dirty Work'] },
        { boxes: ['Hands Clean, Conscience Clear'] },
      ],
      images: [
        {
          src: '/assets/doctors/01-hartnell.jpg',
          name: 'The First Doctor · William Hartnell',
          quote: '"One day, I shall come back. Yes, I shall come back."',
        },
        {
          src: '/assets/doctors/09-eccleston.jpg',
          name: 'The Ninth Doctor · Christopher Eccleston',
          quote: '"Just this once, everybody lives!"',
        },
        {
          src: '/assets/doctors/10-tennant.jpg',
          name: 'The Tenth Doctor · David Tennant',
          quote: '"Wibbly wobbly, timey wimey… stuff."',
        },
        {
          src: '/assets/doctors/11-smith.jpg',
          name: 'The Eleventh Doctor · Matt Smith',
          quote: '"Bow ties are cool."',
        },
        {
          src: '/assets/doctors/12-capaldi.jpg',
          name: 'The Twelfth Doctor · Peter Capaldi',
          quote: '"Laugh hard. Run fast. Be kind."',
        },
        {
          src: '/assets/doctors/13-whittaker.jpg',
          name: 'The Thirteenth Doctor · Jodie Whittaker',
          quote: '"We\'re all capable of the most incredible change."',
        },
        {
          src: '/assets/doctors/15-gatwa.jpg',
          name: 'The Fifteenth Doctor · Ncuti Gatwa',
          quote: '"Nobody grows up wrong."',
        },
      ],
    },
    {
      title: 'The TARDIS',
      text: 'Time And Relative Dimension In Space: his time machine. It goes anywhere in time and space.',
      reveal: true,
      images: [{ src: '/assets/tardis.jpg' }, { src: '/assets/tardis-console.jpg' }],
      boxes: [{ boxes: ['Stuck as a 1960s Police Box'] }, { boxes: ['Bigger on the Inside'] }],
    },
    {
      title: 'The Companions',
      text: 'These are the companions of the Doctor. They travel with him on his adventures, until they get themselves killed (or worse).',
      images: [
        {
          src: '/assets/companions/jack.jpg',
          name: 'The Face of Boe · Captain Jack',
          stamp: 'DEAD',
          stampNote: '(Got better)',
          fate: 'Exterminated by a Dalek',
        },
        {
          src: '/assets/companions/river.jpg',
          name: 'The Wife of the Doctor · River Song',
          stamp: 'DEAD',
          fate: "Uploaded to the Library's computer",
        },
        {
          src: '/assets/companions/amy.jpg',
          name: 'The Girl Who Waited · Amy Pond',
          stamp: 'DEAD',
          fate: 'Zapped to 1938 by a Weeping Angel, lived through WWII',
        },
        {
          src: '/assets/companions/rory.jpg',
          name: 'The Last Centurion · Rory Williams',
          stamp: 'DEAD',
          stampNote: 'Several times',
          fate: 'Once erased from existence',
        },
        {
          src: '/assets/companions/clara.jpg',
          name: 'The Impossible Girl · Clara Oswald',
          stamp: 'DEAD',
          fate: 'Faced the raven',
        },
        {
          src: '/assets/companions/bill.jpg',
          name: "The Doctor's Student · Bill Potts",
          stamp: 'DEAD',
          fate: 'Converted into a Cyberman',
        },
        {
          src: '/assets/companions/donna.jpg',
          name: 'The DoctorDonna · Donna Noble',
          stamp: 'MEMORY WIPED',
          fate: 'Her mind would burn if she ever remembered him',
        },
      ],
    },
    {
      title: 'Rose',
      text: 'Series 1, episode 1: Rose Tyler meets the Doctor. The first event in our timeline, so: the first commit.',
      images: [{ src: '/assets/episodes/rose.jpg' }],
    },
  ],
  build: [
    {
      write: {
        'TARDIS.md': '# TARDIS log\nDoctor: The Ninth Doctor\nCompanions:\n- Rose Tyler\nLocation: London, 2005\n',
      },
    },
  ],
  steps: [
    { cmd: 'git init', caption: 'Every timeline has to start somewhere' },
    {
      cmd: 'git config --global alias.st status',
      caption: "We'll be asking this a lot",
      after: 'git status',
    },
    { cmd: 'git add TARDIS.md', caption: 'Stage the log', accepts: 'git add' },
    {
      cmd: 'git commit -m "Rose"',
      caption: 'S01E01: the first event in the timeline',
      accepts: 'git commit',
    },
  ],
};
