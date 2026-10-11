export type StoryImage = { src: string; name?: string; quote?: string; stamp?: string; stampNote?: string; fate?: string };
/** `reveal`: images are stepped through with →/← instead of rotating. */
export type StoryCard = { title: string; text: string; images: StoryImage[]; reveal?: boolean };
export type Step = { cmd: string; caption: string };

export type GitStep =
  | { write: Record<string, string> }
  | { git: string[] }
  | { commit: string; files?: Record<string, string> };

export type Scene = {
  id: string;
  episode: string;
  title: string;
  story: StoryCard[];
  build: GitStep[];
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
};

export type FileStatus = 'clean' | 'untracked' | 'modified' | 'staged' | 'conflicted';
/** `code`: the two-letter `git status --short` code, '' when clean. */
export type WorkFile = { path: string; status: FileStatus; code: string };
export type WorkDir = { files: WorkFile[]; merging: boolean };

export type LiveState = { graph: GraphModel; workdir: WorkDir };
export type RunResult = LiveState & { output: string; code: number };
