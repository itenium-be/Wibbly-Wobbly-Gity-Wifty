import { useCallback, useEffect, useRef, useState } from 'react';
import type { GraphModel, RunResult, SceneView, WorkDir } from '../shared/types';
import { enterScene, fetchScenes, readFile, runCommand, writeFile } from './api';
import { Console } from './console/Console';
import { advance } from './cue';
import { FlatTimeline } from './graph/FlatTimeline';
import { layout } from './graph/layout';
import { move, type Position } from './nav';
import { StoryCardView } from './story/StoryCardView';
import { WorkDirPanel } from './workdir/WorkDirPanel';

export function App() {
  const [scenes, setScenes] = useState<SceneView[]>([]);
  const [pos, setPos] = useState<Position>({ scene: 0, card: 0, image: 0 });
  const [graph, setGraph] = useState<GraphModel | null>(null);
  const [workdir, setWorkdir] = useState<WorkDir | null>(null);
  const [cueIndex, setCueIndex] = useState(0);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped on every reset so responses for a scene we already left are dropped.
  const epoch = useRef(0);
  const running = useRef(false);

  useEffect(() => {
    fetchScenes().then(setScenes);
  }, []);

  const scene = scenes[pos.scene];
  const sceneId = scene?.id;
  const gitPhase = scene !== undefined && pos.card === scene.story.length;

  const reset = useCallback(async () => {
    if (!sceneId) return;
    const mine = ++epoch.current;
    // Keeps the panel from diffing the next scene's statuses against this one's.
    setWorkdir(null);
    const entered = await enterScene(sceneId);
    if (mine !== epoch.current) return;
    setGraph(entered.graph);
    setWorkdir(entered.workdir);
    setCueIndex(0);
    setInput('');
    setOutput('');
    inputRef.current?.focus();
  }, [sceneId]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (gitPhase) inputRef.current?.focus();
  }, [gitPhase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return;
      const typing = e.target instanceof HTMLInputElement;
      if (typing && (e.target as HTMLInputElement).value !== '') return;
      if (e.key === 'ArrowRight') setPos((p) => move(p, 1, scenes));
      else if (e.key === 'ArrowLeft') setPos((p) => move(p, -1, scenes));
      else if (e.key === 'r' && !typing) reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [scenes, reset]);

  if (!scene) return null;

  const run = async (cmd: string) => {
    if (running.current) return;
    running.current = true;
    const mine = epoch.current;
    let result: RunResult;
    try {
      result = await runCommand(cmd);
    } catch (e) {
      if (mine === epoch.current) setOutput(`$ ${cmd}\n${e instanceof Error ? e.message : String(e)}`);
      return;
    } finally {
      running.current = false;
    }
    if (mine !== epoch.current) return;
    setOutput(`$ ${cmd}\n${result.output}`);
    setGraph(result.graph);
    setWorkdir(result.workdir);
    setCueIndex((i) => advance(scene.steps, i, cmd, result.code));
    setInput('');
  };

  const save = async (path: string, content: string) => {
    const mine = epoch.current;
    const updated = await writeFile(path, content);
    if (mine === epoch.current) setWorkdir(updated);
  };

  return (
    <>
      <header>
        <div className="ep">
          <small>{scene.episode}</small>
          {scene.title}
        </div>
        <div className="progress">
          scene {pos.scene + 1} / {scenes.length}
        </div>
      </header>
      {gitPhase ? (
        <>
          <main>{graph && <FlatTimeline layout={layout(graph)} />}</main>
          {workdir && (
            <WorkDirPanel
              key={scene.id}
              workdir={workdir}
              branch={graph?.initialized ? (graph.head.branch ?? 'HEAD (detached)') : ''}
              load={readFile}
              save={save}
              onDone={() => inputRef.current?.focus()}
            />
          )}
          <Console
            cue={scene.steps[cueIndex]}
            value={input}
            onChange={setInput}
            onRun={run}
            output={output}
            inputRef={inputRef}
          />
        </>
      ) : (
        <StoryCardView key={`${scene.id}-${pos.card}`} card={scene.story[pos.card]} image={pos.image} />
      )}
    </>
  );
}
