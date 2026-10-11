/** `card === story.length` is the scene's git phase; a scene with empty `steps` has none. `step` only moves on reveal cards. */
export type Position = { scene: number; card: number; step: number };
type NavCard = { images: unknown[]; reveal?: boolean; boxes?: unknown[] };
type NavScene = { story: unknown[]; steps?: unknown[] };

const lastCard = (scene: NavScene) => (scene.steps?.length === 0 ? scene.story.length - 1 : scene.story.length);

export function move(pos: Position, dir: 1 | -1, scenes: { story: NavCard[]; steps?: unknown[] }[]): Position {
  const last = (scene: number) => lastCard(scenes[scene]);
  const steps = (scene: number, card: number) => {
    const c = scenes[scene].story[card];
    if (!c) return 1;
    return (c.reveal ? c.images.length : 1) + Math.max((c.boxes?.length ?? 0) - 1, 0);
  };
  const enterBack = (scene: number, card: number) => ({ scene, card, step: steps(scene, card) - 1 });

  if (dir === 1) {
    if (pos.step < steps(pos.scene, pos.card) - 1) return { ...pos, step: pos.step + 1 };
    if (pos.card < last(pos.scene)) return { ...pos, card: pos.card + 1, step: 0 };
    if (pos.scene < scenes.length - 1) return { scene: pos.scene + 1, card: 0, step: 0 };
    return pos;
  }
  if (pos.step > 0) return { ...pos, step: pos.step - 1 };
  if (pos.card > 0) return enterBack(pos.scene, pos.card - 1);
  if (pos.scene > 0) return enterBack(pos.scene - 1, last(pos.scene - 1));
  return pos;
}

type NamedScene = NavScene & { id: string };

export function toQuery(pos: Position, scenes: NamedScene[]): string {
  return `?${new URLSearchParams({ scene: scenes[pos.scene].id, card: String(pos.card) })}`;
}

export function fromQuery(search: string, scenes: NamedScene[]): Position {
  const params = new URLSearchParams(search);
  const scene = scenes.findIndex((s) => s.id === params.get('scene'));
  if (scene < 0) return { scene: 0, card: 0, step: 0 };
  const card = Number.parseInt(params.get('card') ?? '', 10) || 0;
  return { scene, card: Math.min(Math.max(card, 0), lastCard(scenes[scene])), step: 0 };
}
