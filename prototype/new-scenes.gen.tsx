// Generates prototype/new-scenes.html (or prototype/<scenario>.html for one scenario): replays the real scenes, runs each candidate scene on top with real git,
// and renders every step with the app's own layout + FlatTimeline.
// Run: bun prototype/new-scenes.gen.tsx [scenario]
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { scenes } from '../scenes';
import { blink, doomsday, forestOfTheDead, stolenEarth } from '../scenes/episodes';
import { Engine } from '../server/engine';
import { readGraph } from '../server/graph';
import { play } from '../server/play';
import { applyEpisode } from '../server/tardis';
import { readWorkDir } from '../server/workdir';
import type { Episode, GraphModel, Scene, WorkDir } from '../shared/types';
import { parseAnsi } from '../web/console/ansi';
import { episodeCodes } from '../web/episodes';
import { FlatTimeline } from '../web/graph/FlatTimeline';
import { layout } from '../web/graph/layout';

type Step =
  | { cmd: string | ((live: string) => Promise<string>); caption: string }
  | { episode: Episode; caption: string; date: string }
  | { edit: (live: string) => Promise<string>; caption: string };
type Scenario = {
  id: string;
  title: string;
  lore: string;
  scenes?: Scene[];
  start: string;
  setup?: number;
  steps: Step[];
};

const runawayBride: Episode = {
  code: 'S03E00',
  aired: '2006-12-25',
  title: 'The Runaway Bride',
  set: { Companions: ['Donna Noble'], Location: 'London, Christmas 2006' },
  event: 'The Doctor stopped the Racnoss. Donna saved him.',
};
const turnRight: Episode = {
  code: 'Chiswick',
  title: 'Turn Right',
  set: { Companions: [], Location: 'Chiswick, a time beetle on her back' },
  event: 'Donna turned right. She never met the Doctor.',
  fastForward: true,
};
const doctorDies: Episode = {
  code: 'Christmas 2006',
  title: 'The Doctor dies',
  set: { Doctor: 'dead, under the Thames', Location: 'London, Christmas 2006' },
  event: 'The Doctor drowned the Racnoss, and himself. Nobody stopped him.',
  fastForward: true,
};
const titanic: Episode = {
  code: 'Christmas 2007',
  title: 'The Titanic falls on London',
  set: { Location: 'Leeds, refugee housing' },
  event: 'The Titanic fell on London',
  fastForward: true,
};
const starsGoingOut: Episode = {
  code: '2008',
  title: 'The stars are going out',
  event: 'The stars are going out',
  fastForward: true,
};
const dimensionCannon: Episode = {
  code: "Torchwood, Pete's World",
  title: 'The dimension cannon',
  event: 'Rose built a dimension cannon. The stars are going out, in every universe.',
  fastForward: true,
};
const turnLeft: Episode = {
  code: 'S04E11',
  aired: '2008-06-21',
  title: 'Turn Left',
  event: 'Bad Wolf. The darkness is coming.',
};
const inBroadcastOrder: Scene[] = scenes.map((scene) => {
  if (scene.id === 'parting-of-the-ways')
    return {
      ...scene,
      steps: scene.steps.flatMap((s) => {
        if ('episode' in s && s.episode === blink) return [{ episode: runawayBride }, s];
        if ('episode' in s && s.episode === forestOfTheDead) return [s, { episode: turnLeft }];
        return [s];
      }),
    };
  if (scene.id === 'petes-world')
    return {
      ...scene,
      steps: scene.steps.flatMap((s) => {
        if ('cmd' in s) return [{ ...s, cmd: s.cmd.replace('HEAD~2', 'HEAD~4') }];
        if (s.episode === doomsday) return [s, { episode: dimensionCannon }];
        if (s.episode === stolenEarth) return [];
        return [s];
      }),
    };
  return scene;
});
const git = async (live: string, args: string[]) =>
  (await Bun.$`git ${args}`.cwd(live).env({ ...process.env, GIT_CONFIG_GLOBAL: `${live}.gitconfig` }).text()).trim();
const metacrisis: Episode = {
  code: 'Bad Wolf Bay',
  title: 'Metacrisis',
  set: { 'Metacrisis Doctor': 'half-human, one heart' },
  fastForward: true,
};

const show = async (live: string, rev: string) =>
  (await Bun.$`git show ${rev}`.cwd(live).env({ ...process.env, GIT_CONFIG_GLOBAL: `${live}.gitconfig` }).text());

const scenarios: Scenario[] = [
  {
    id: 'turn-left',
    title: 'Turn Left · branch from the past, cherry-pick across universes',
    lore: "Between Pete's World and Journey's End. Prime already runs in broadcast order: … The Runaway Bride → Blink → Forest of the Dead → Turn Left; The Stolen Earth moves into this scene. Pete's World now ends with Rose building the dimension cannon. Donna's dark world forks off where she would have met the Doctor; Rose's commit crosses into it from petes-world.",
    scenes: inBroadcastOrder,
    start: 'petes-world',
    setup: 5,
    steps: [
      { cmd: 'git log --oneline -5', caption: 'The real timeline: Donna met the Doctor at Christmas' },
      {
        cmd: async (live) =>
          `git switch -c turn-right ${await git(live, ['log', '--format=%h', '-1', '--grep', 'Runaway Bride'])}~1`,
        caption: 'A time beetle: back to just before The Runaway Bride',
      },
      { episode: turnRight, caption: 'Donna turns right', date: '2006-12-24 19:00:00 +0000' },
      { episode: doctorDies, caption: 'Nobody stops him: the Doctor dies fighting the Racnoss', date: '2006-12-25 20:00:00 +0000' },
      { episode: titanic, caption: 'No Doctor to save London', date: '2007-12-25 20:00:00 +0000' },
      { cmd: 'git cherry-pick petes-world', caption: 'Rose crosses over from her universe' },
      {
        edit: async (live) => applyEpisode(await show(live, 'turn-right:TARDIS.md'), dimensionCannon),
        caption: 'Resolve TARDIS.md: Rose, in the dark world',
      },
      { cmd: 'git add TARDIS.md && git cherry-pick --continue', caption: 'Rose finds Donna' },
      { episode: starsGoingOut, caption: 'The stars are going out', date: '2008-06-14 19:00:00 +0000' },
      { cmd: 'git switch prime-timeline', caption: 'Rose sends Donna back: she turns left' },
      { cmd: 'git branch -d turn-right', caption: 'Git refuses: that world has commits nowhere else' },
      { cmd: 'git branch -D turn-right', caption: 'That world never happened' },
      { cmd: 'git log --oneline -1 petes-world', caption: 'Rose is still in her universe, cannon ready' },
      { episode: stolenEarth, caption: 'Bad Wolf: the darkness comes', date: '' },
    ],
  },
  {
    id: 'metacrisis',
    title: 'The Metacrisis Doctor · cherry-pick',
    lore: "At the end of Journey's End, after the merge and before closing the void. The same change, copied into Pete's World with a new hash.",
    start: 'journeys-end',
    setup: 3,
    steps: [
      { episode: metacrisis, caption: "The hand, Donna's touch: a second Doctor", date: '2008-07-05 19:30:00 +0000' },
      { cmd: 'git switch petes-world', caption: 'To Bad Wolf Bay' },
      { cmd: 'git cherry-pick -x prime-timeline', caption: 'The same Doctor, in another universe' },
      {
        edit: async (live) => applyEpisode(await show(live, 'petes-world:TARDIS.md'), metacrisis),
        caption: 'Resolve TARDIS.md: one heart, not two',
      },
      { cmd: 'git add TARDIS.md && git cherry-pick --continue', caption: 'He stays with Rose' },
      { cmd: 'git log -1 --format=%B', caption: '-x: he remembers being the Doctor' },
      {
        cmd: 'git log --oneline --all --grep Metacrisis',
        caption: 'Same change, two hashes: two Doctors',
      },
      { cmd: 'git switch prime-timeline', caption: 'Back to our universe' },
      { cmd: 'git branch -d petes-world', caption: "The void won't close: someone's still on the other side" },
    ],
  },
  {
    id: 'pandorica',
    title: 'The Pandorica · stash',
    lore: 'Placement open: shown here after Bad Wolf. Unfinished work blocks the trip to 1987; seal it in the box, go, come back, open it.',
    start: 'outro',
    steps: [
      { cmd: "sed -i 's/^Companions:$/Companions:\\n- Amy Pond/' TARDIS.md", caption: 'Amy joins, not committed yet' },
      { cmd: 'git switch --detach fixed-point/pete', caption: 'Off to 1987?' },
      { cmd: 'git stash push -m "Amy Pond"', caption: 'Into the Pandorica' },
      { cmd: 'git stash list', caption: 'The box, sealed' },
      { cmd: 'git switch --detach fixed-point/pete', caption: '1987, empty-handed' },
      { cmd: 'grep Pete TARDIS.md', caption: 'Pete is dead here: a fixed point' },
      { cmd: 'git switch prime-timeline', caption: '2,000 years later' },
      { cmd: 'git stash pop', caption: 'The Pandorica opens: Amy, exactly as she was' },
    ],
  },
];

type Frame = { cmd: string; caption: string; output: string; code: number; graph: GraphModel; workdir: WorkDir };

const only = process.argv[2];
const out = only ? `${only}.html` : 'new-scenes.html';
const rendered: { scenario: Scenario; frames: Frame[] }[] = [];
for (const scenario of scenarios.filter((x) => !only || x.id === only)) {
  const home = await mkdtemp(join(tmpdir(), 'tardis-mock-'));
  const engine = new Engine(home, scenario.scenes ?? scenes);
  await engine.prepare();
  const live = join(home, 'live');
  const config = `${live}.gitconfig`;
  const state = async () => ({ graph: await readGraph(live), workdir: await readWorkDir(live) });
  await engine.enter(scenario.start);
  const base = (scenario.scenes ?? scenes).find((s) => s.id === scenario.start);
  for (const step of base?.steps.slice(0, scenario.setup ?? 0) ?? []) {
    if ('cmd' in step) await engine.run(step.cmd);
    else if ('edit' in step) for (const [p, c] of Object.entries(step.edit)) await engine.writeFile(p, c);
    else await engine.episode(step.episode.code);
  }
  const frames: Frame[] = [{ cmd: '', caption: 'Start', output: '', code: 0, ...(await state()) }];
  for (const step of scenario.steps) {
    if ('cmd' in step) {
      const cmd = typeof step.cmd === 'string' ? step.cmd : await step.cmd(live);
      const r = await engine.run(cmd);
      frames.push({ cmd, caption: step.caption, output: r.output, code: r.code, ...(await state()) });
    } else if ('edit' in step) {
      await engine.writeFile('TARDIS.md', await step.edit(live));
      frames.push({ cmd: '(edit TARDIS.md in the editor)', caption: step.caption, output: '', code: 0, ...(await state()) });
    } else {
      const p = await play(live, { episode: step.episode }, { config, color: true, date: step.date || undefined });
      frames.push({ cmd: p.cmd, caption: step.caption, output: p.output, code: p.code, ...(await state()) });
    }
  }
  rendered.push({ scenario, frames });
}

const codes = {
  ...episodeCodes(scenes),
  ...Object.fromEntries(
    [runawayBride, turnRight, doctorDies, titanic, starsGoingOut, dimensionCannon, turnLeft].map((e) => [e.title, e.code]),
  ),
  [metacrisis.title]: metacrisis.code,
};
const SCALE = 0.62;
const svg = (f: Frame) => {
  const html = renderToStaticMarkup(
    <FlatTimeline layout={layout(f.graph, f.workdir.files.some((x) => x.status !== 'clean'))} codes={codes} />,
  );
  const [, , w, h] = (html.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 1 1').split(' ').map(Number);
  return html.replace(/style="[^"]*"/, `style="width:${Math.round(w * SCALE)}px;height:${Math.round(h * SCALE)}px"`);
};
const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const ansi = (s: string) =>
  parseAnsi(s)
    .map((seg) => (seg.classes.length ? `<span class="${seg.classes.join(' ')}">${esc(seg.text)}</span>` : esc(seg.text)))
    .join('');
const files = (w: WorkDir) =>
  w.files.map((f) => `<span class="st st-${f.status}">${esc(f.code || '  ')} ${esc(f.path)}</span>`).join('') +
  (w.merging ? '<span class="st st-conflicted">MERGING</span>' : '');

const css = await Bun.file(join(import.meta.dir, '../web/styles.css')).text();
const rootVars = css.match(/:root \{[\s\S]*?\n\}/)?.[0] ?? '';
const timelineCss = css.slice(css.indexOf('/* timeline */'), css.indexOf('@keyframes bob'));
const ansiCss = css.slice(css.indexOf('.ansi-bold'), css.indexOf('/* story cards */'));
const pendingCss = css.slice(css.indexOf('.timeline .pending {'), css.indexOf('/* blame */'));

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New Scene Mockups</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Orbitron:wght@500;700&display=swap">
<style>
${rootVars}
${timelineCss}
${pendingCss}
${ansiCss}
html, body { margin: 0; color: var(--text); font-family: "JetBrains Mono", monospace; background: var(--space); }
body { padding: 24px 32px 80px; }
h1, h2 { font-family: Orbitron, sans-serif; }
h1 { font-size: 28px; margin: 0 0 8px; }
nav a { color: var(--glow); margin-right: 24px; }
section.scenario { margin-top: 48px; }
section.scenario > p { color: var(--muted); max-width: 900px; }
.step { margin: 24px 0; border: 1px solid var(--line); border-radius: 8px; background: rgba(10, 16, 40, 0.82); }
.step header { display: flex; gap: 16px; align-items: baseline; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.step .n { color: var(--gold); font-weight: 600; }
.step .cmd { font-size: 18px; }
.step .cmd.fail { color: var(--danger); }
.step .caption { color: var(--muted); margin-left: auto; text-align: right; }
.step .body { display: grid; grid-template-columns: minmax(0, 1fr) 420px; }
.step .tl { overflow-x: auto; border-right: 1px solid var(--line); }
.step .side { padding: 12px 16px; font-size: 13px; min-width: 0; }
.step pre { margin: 0 0 12px; white-space: pre-wrap; word-break: break-all; color: var(--muted); }
.st { display: block; }
.st-untracked { color: var(--st-untracked); } .st-modified { color: var(--st-modified); }
.st-staged { color: var(--st-staged); } .st-conflicted { color: var(--st-conflicted); }
.label { color: var(--muted); font-size: 11px; letter-spacing: 2px; margin-bottom: 4px; }
</style>
</head>
<body>
<h1>New scene mockups</h1>
<p style="color:var(--muted)">Real git, replayed on top of the current scenes; timelines drawn with the app's own layout.</p>
<nav>${rendered.map(({ scenario }) => `<a href="#${scenario.id}">${esc(scenario.title)}</a>`).join('')}</nav>
${rendered
  .map(
    ({ scenario, frames }) => `<section class="scenario" id="${scenario.id}">
<h2>${esc(scenario.title)}</h2>
<p>${esc(scenario.lore)}</p>
${frames
  .map(
    (f, i) => `<div class="step">
<header><span class="n">${i}</span><span class="cmd${f.code ? ' fail' : ''}">${f.cmd ? `$ ${esc(f.cmd)}` : '(start of scene)'}</span><span class="caption">${esc(f.caption)}</span></header>
<div class="body"><div class="tl">${svg(f)}</div>
<div class="side"><div class="label">OUTPUT${f.code ? ` · EXIT ${f.code}` : ''}</div><pre>${ansi(f.output) || '—'}</pre>
<div class="label">WORKING DIR · ${esc(f.graph.head.branch ?? 'HEAD (detached)')}</div><pre>${files(f.workdir) || 'clean'}</pre></div></div>
</div>`,
  )
  .join('\n')}
</section>`,
  )
  .join('\n')}
<script>
for (const tl of document.querySelectorAll('.tl')) {
  const t = tl.querySelector('.tardis');
  if (t) tl.scrollLeft = t.getBoundingClientRect().left - tl.getBoundingClientRect().left - tl.clientWidth / 2;
}
</script>
</body>
</html>
`;
await Bun.write(join(import.meta.dir, out), page);
console.log(`wrote prototype/${out} (${rendered.map((r) => `${r.scenario.id}: ${r.frames.length}`).join(', ')})`);
