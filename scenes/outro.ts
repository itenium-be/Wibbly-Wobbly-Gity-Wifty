import type { Scene } from '../shared/types';

export const outro: Scene = {
  id: 'outro',
  episode: 'S04E18',
  title: 'The End of Time',
  story: [
    {
      title: 'Wibbly Wobbly Gity Wifty',
      text: '',
      images: [{ src: '/assets/episodes/end-of-time.jpg' }],
      boxes: [{ boxes: ["I Don't Want to Go"] }, { boxes: ['Questions?'] }],
      qr: { src: '/assets/qr.svg', url: 'https://github.com/itenium-be/Wibbly-Wobbly-Gity-Wifty' },
    },
  ],
  steps: [],
};
