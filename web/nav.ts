/** `card === story.length` is the scene's git phase. */
export type Position = { scene: number; card: number };

export function move(pos: Position, dir: 1 | -1, scenes: { story: unknown[] }[]): Position {
  const last = (scene: number) => scenes[scene].story.length;
  if (dir === 1) {
    if (pos.card < last(pos.scene)) return { ...pos, card: pos.card + 1 };
    if (pos.scene < scenes.length - 1) return { scene: pos.scene + 1, card: 0 };
    return pos;
  }
  if (pos.card > 0) return { ...pos, card: pos.card - 1 };
  if (pos.scene > 0) return { scene: pos.scene - 1, card: last(pos.scene - 1) };
  return pos;
}
