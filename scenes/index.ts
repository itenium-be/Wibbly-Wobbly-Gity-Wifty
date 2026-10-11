import type { Scene } from '../shared/types';
import { badWolfScene } from './bad-wolf';
import { blinkScene } from './blink';
import { fathersDayScene } from './fathers-day';
import { journeysEnd } from './journeys-end';
import { outro } from './outro';
import { partingOfTheWaysScene } from './parting-of-the-ways';
import { petesWorld } from './petes-world';
import { riversDiary } from './rivers-diary';
import { rose } from './rose';
import { turnLeft } from './turn-left';

export const scenes: Scene[] = [
  rose,
  fathersDayScene,
  partingOfTheWaysScene,
  petesWorld,
  journeysEnd,
  blinkScene,
  riversDiary,
  badWolfScene,
  turnLeft,
  outro,
];
