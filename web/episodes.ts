import type { SceneView } from '../shared/types';

/** Commit message → episode code. Typed commits only match when they use the scene's title. */
export function episodeCodes(scenes: SceneView[]): Record<string, string> {
  const codes: Record<string, string> = {};
  for (const scene of scenes) {
    codes[scene.title] = scene.episode;
    for (const step of scene.steps) if ('episode' in step) codes[step.episode.title] = step.episode.code;
  }
  return codes;
}

export function darkEpisodes(scenes: SceneView[]): Set<string> {
  return new Set(
    scenes.flatMap((scene) => scene.steps.flatMap((s) => ('episode' in s && s.episode.dark ? [s.episode.title] : []))),
  );
}
