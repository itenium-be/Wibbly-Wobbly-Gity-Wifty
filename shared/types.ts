export type StoryImage = {
  src: string;
  name?: string;
  quote?: string;
  stamp?: string;
  stampNote?: string;
  /** Presenter's reference only: not shown on the slide. */
  fate?: string;
};
/** `reveal`: images are stepped through with →/← instead of rotating. */
export type StoryCard = { title: string; text: string; images: StoryImage[]; reveal?: boolean };
/** `set`: `Key: value` lines in TARDIS.md, or `Key:` and a `- item` per entry. `event`: a line appended under `Events:`. */
/**
 * `aired`: broadcast date (YYYY-MM-DD); the commit carries it so the timeline sorts in broadcast order.
 * `writer`: the commit's author, so `git blame` names who wrote each line; the Doctor stays the committer.
 * `fastForward`: a scripted moment inside an episode, not a new episode.
 * `dark`: a dark-world commit; the timeline draws it red while it sits on prime.
 */
export type Episode = {
  code: string;
  title: string;
  aired?: string;
  writer?: string;
  set?: Record<string, string | string[]>;
  event?: string;
  fastForward?: true;
  dark?: true;
};
/**
 * `fails`: the cue is expected to exit non-zero and still counts as done.
 * `accepts`: any command starting with this also counts as done (`git add` for `git add .`).
 * `after`: only cued right after the presenter ran this command; replays always play it.
 */
export type CmdStep = { cmd: string; caption: string; fails?: true; accepts?: string; after?: string };
export type EpisodeStep = { episode: Episode };
/** The presenter makes this edit in the working directory panel; replays write it directly. */
export type EditStep = { edit: Record<string, string>; caption: string };
export type Step = CmdStep | EpisodeStep | EditStep;

export type GitStep =
  | { write: Record<string, string> }
  | { git: string[] }
  | { commit: string; files?: Record<string, string> };

export type Scene = {
  id: string;
  episode: string;
  title: string;
  story: StoryCard[];
  build?: GitStep[];
  steps: Step[];
};
export type SceneView = Omit<Scene, 'build'>;

export type Commit = { hash: string; short: string; message: string; parents: string[] };
export type Ref = { name: string; hash: string };
export type GraphModel = {
  initialized: boolean;
  commits: Commit[];
  branches: Ref[];
  tags: Ref[];
  head: { hash: string | null; branch: string | null };
  /** The commit being merged in while a merge waits for its conflicts to be resolved. */
  mergeHead?: string;
};

/** Consecutive lines last changed by one commit. `date`: author date, YYYY-MM-DD. */
export type BlameHunk = { hash: string; author: string; date: string; summary: string; lines: string[] };

export type FileStatus = 'clean' | 'untracked' | 'modified' | 'staged' | 'conflicted';
/** `code`: the two-letter `git status --short` code, '' when clean. */
export type WorkFile = { path: string; status: FileStatus; code: string };
export type WorkDir = { files: WorkFile[]; merging: boolean };

export type LiveState = { graph: GraphModel; workdir: WorkDir };
export type RunResult = LiveState & { output: string; code: number };
export type EpisodeResult = RunResult & { cmd: string };
