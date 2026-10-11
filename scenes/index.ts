import type { Scene } from '../shared/types';
import { badWolfScene } from './bad-wolf';
import { blinkScene } from './blink';
import { fixedPoints } from './fixed-points';
import { journeysEnd } from './journeys-end';
import { outro } from './outro';
import { petesWorld } from './petes-world';
import { riversDiary } from './rivers-diary';
import { rose } from './rose';

export const scenes: Scene[] = [
  rose,
  fixedPoints,
  petesWorld,
  journeysEnd,
  blinkScene,
  riversDiary,
  badWolfScene,
  outro,
];
