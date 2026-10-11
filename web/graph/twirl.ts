type Point = { x: number; y: number };

const HOP = 140;
const TURNS = 3;
const WOBBLE_DEG = 25;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Pose at flight progress `t` ∈ [0, 1]. `turn` is the horizontal scale of a box spinning about its vertical axis: 1 front, -1 back. */
export function twirl(t: number, from: Point, to: Point) {
  const e = ease(t);
  const arc = Math.sin(Math.PI * t);
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e - arc * HOP,
    rot: Math.sin(t * Math.PI * 3) * WOBBLE_DEG * arc,
    turn: Math.cos(e * Math.PI * 2 * TURNS),
  };
}
