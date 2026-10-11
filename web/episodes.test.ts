import { describe, expect, test } from 'bun:test';
import type { SceneView } from '../shared/types';
import { episodeCodes } from './episodes';

describe('episodeCodes', () => {
  test('maps scene titles and episode step titles to their codes', () => {
    const scenes: SceneView[] = [
      {
        id: 'rose',
        episode: 'S01E01',
        title: 'Rose',
        story: [],
        steps: [{ cmd: 'git init', caption: '' }, { episode: { code: 'S01E02', title: 'The End of the World' } }],
      },
    ];
    expect(episodeCodes(scenes)).toEqual({ Rose: 'S01E01', 'The End of the World': 'S01E02' });
  });
});
