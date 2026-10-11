/** `card === story.length` is the scene's git phase. `image` only moves on reveal cards. */
export type Position = { scene: number; card: number; image: number };
type NavCard = { images: unknown[]; reveal?: boolean };

export function move(pos: Position, dir: 1 | -1, scenes: { story: NavCard[] }[]): Position {
  const last = (scene: number) => scenes[scene].story.length;
  const steps = (scene: number, card: number) => {
    const c = scenes[scene].story[card];
    return c?.reveal ? c.images.length : 1;
  };
  const enterBack = (scene: number, card: number) => ({ scene, card, image: steps(scene, card) - 1 });

  if (dir === 1) {
    if (pos.image < steps(pos.scene, pos.card) - 1) return { ...pos, image: pos.image + 1 };
    if (pos.card < last(pos.scene)) return { ...pos, card: pos.card + 1, image: 0 };
    if (pos.scene < scenes.length - 1) return { scene: pos.scene + 1, card: 0, image: 0 };
    return pos;
  }
  if (pos.image > 0) return { ...pos, image: pos.image - 1 };
  if (pos.card > 0) return enterBack(pos.scene, pos.card - 1);
  if (pos.scene > 0) return enterBack(pos.scene - 1, last(pos.scene - 1));
  return pos;
}
