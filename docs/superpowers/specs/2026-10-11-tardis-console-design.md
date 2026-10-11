# TARDIS Console — Design

A 50-minute presented git session, delivered through a custom web app instead of slides.
Doctor Who (2005 revival, from "Rose") is the running storyline; the repo is the timeline.

## Audience & format

- Mixed audience: basics fast, then specials (bisect, rebase, reflog) for the experienced.
- Presented, not hands-on. The presenter types every git command live in the app.
- Take-home: this public repo.

## Run of show

| Time  | Min | Scene                        | Git                                         | Doctor Who                                       |
|-------|-----|------------------------------|---------------------------------------------|--------------------------------------------------|
| 00:00 | 4   | Cold open                    | —                                           | The show, the Doctor, the TARDIS, the companions   |
| 04:00 | 3   | Rose                         | `init`, `commit`, `log`, HEAD               | The timeline begins; HEAD = where the TARDIS is  |
| 07:00 | 4   | Fixed points                 | `tag`, `checkout <tag>`, detached HEAD      | Pompeii: look, but don't change                  |
| 11:00 | 4   | Pete's World                 | `branch`, `switch`                          | Parallel universe                                |
| 15:00 | 5   | Journey's End                | `merge` + conflict                          | Universes collide                                |
| 20:00 | 8   | Special: Blink               | `bisect start/good/bad/run`                 | Find where the Angels got in                     |
| 28:00 | 7   | Special: Father's Day        | `rebase`; `push --force` on shared history  | Rose saves Pete, the Reapers arrive              |
| 35:00 | 7   | Special: River's diary       | `reflog`, `reset --hard`, recovery          | Spoilers; nothing is truly lost                  |
| 42:00 | 4   | Bad Wolf                     | `log --grep`, `blame`                       | A message scattered through time                 |
| 46:00 | 4   | Outro + Q&A                  | Recap: scene → command                      | Repo link                                        |

Out of scope: cherry-pick, interactive rebase. First cut if over time: Bad Wolf.

## Architecture

- Bun + TypeScript backend, React + Vite frontend. Runs on localhost on the presenter's laptop.
- Real git underneath. The backend executes commands in a throwaway demo repo.

### Scenes are data

```ts
type Scene = {
  id: string;                                   // "fathers-day"
  episode: string;                              // "S01E08"
  title: string;                                // "Father's Day"
  story: StoryCard[];                           // episode recap → how it maps to git
  build: GitStep[];                             // deterministic script → starting repo state
  steps: { cmd: string; caption: string }[];    // cues for the live part
};
```

### Snapshots

- Each scene's `build` runs against a fresh repo with fixed `GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE`, so hashes are identical on every run.
- Result is stored as that scene's snapshot. Entering or resetting a scene copies the snapshot into the live working directory.

### Command input

- The presenter types every command. The next `steps` entry is shown as ghost text after the cursor, with its caption below.
- Whatever is typed runs, so off-script commands work. Only `git …` is accepted.
- Raw git output is shown next to the input.

### Graph

- Backend exposes the repo as one JSON model: commits (hash, message, parents), refs, tags, HEAD, reflog.
- Renderer consumes only that model, so it can be swapped.
- v1 renderer: flat 2D SVG lanes (prototype variant A).
  - One lane per branch, labelled as a universe.
  - Commit = episode node, message as label, short hash below.
  - Tag = gold star, "fixed point".
  - HEAD = TARDIS icon, animates to its new position.
- Later: 3D renderer with react-three-fiber (prototype variant C), behind the same model.

### Scene flow

Each scene: story cards → git phase (graph + command input).
The cold open is the Rose scene's story cards: the show, the Doctor, the TARDIS, the companions. Pure lore, no git.

### Story cards

```ts
type StoryCard = {
  title: string;                                            // "The Companions"
  text: string;
  images: StoryImage[];                                     // rotates when > 1
  reveal?: boolean;                                         // `→` steps through images instead
};
type StoryImage = { src: string; name?: string; quote?: string; stamp?: string; fate?: string };
```

Full-screen slide: large image left, title + text right.

```
┌────────────────────────────────────────────────────────────┐
│                                              S01E01 · Rose │
│  ┌──────────────────────────┐                              │
│  │                          │   THE COMPANIONS             │
│  │     [ Amy Pond still ]   │                              │
│  │      crossfades every    │   They travel with him on    │
│  │      ~3s to the next     │   his adventures, until      │
│  │                          │   they get themselves        │
│  │                          │   killed (or worse).         │
│  └──────────────────────────┘                              │
│   AMY POND                                                 │
│   DIED                                                     │
│   Zapped to 1938 by a Weeping Angel        ● ● ○ ● ●       │
└────────────────────────────────────────────────────────────┘
```

- More than one image: crossfade every ~3s; captions swap with the image; dots show the position.
- `→` advances the card, not the image, except on a `reveal` card: there `→` / `←` step through the images first, and nothing auto-rotates.
- Captions: `name`, then `quote` (italic), `stamp` (large, red) and `fate` (small, under the stamp).

Cold open cards:

| Card           | Mode   | Images                                  | Captions             |
|----------------|--------|-----------------------------------------|----------------------|
| The Show       | single | The First Doctor                        | —                    |
| The Doctor     | auto   | 9, 10, 11, 12, 13, 15                   | name + quote         |
| The TARDIS     | reveal | Police box → console room               | —                    |
| The Companions | auto   | Those who died first, then Donna        | name + stamp + fate  |

The Doctor card skips War (one special) and 14 (Tennant again).

| Doctor | Quote                                                 | From                          |
|--------|-------------------------------------------------------|-------------------------------|
| 9      | "Just this once, everybody lives!"                    | *The Doctor Dances*           |
| 10     | "Wibbly wobbly, timey wimey… stuff."                  | *Blink*                       |
| 11     | "Bow ties are cool."                                  | *The Eleventh Hour*           |
| 12     | "Laugh hard. Run fast. Be kind."                      | *Twice Upon a Time*           |
| 13     | "We're all capable of the most incredible change."    | *The Woman Who Fell to Earth* |
| 15     | "Nobody grows up wrong."                              | *Space Babies*                |

Rose is not among the companions: she is the next card.

| Companion     | Stamp        | Fate                                                    |
|---------------|--------------|---------------------------------------------------------|
| Captain Jack  | DIED         | Exterminated by a Dalek. Got better.                    |
| River Song    | DIED         | Uploaded to the Library's computer                       |
| Amy Pond      | DIED         | Zapped to 1938 by a Weeping Angel, lived through WWII    |
| Rory Williams | DIED         | Several times. Once erased from existence                |
| Clara Oswald  | DIED         | Faced the raven                                          |
| Bill Potts    | DIED         | Converted into a Cyberman                                |
| Donna Noble   | MEMORY WIPED | Her mind would burn if she ever remembered him           |

### Layout

```
┌────────────────────────────────────────────────┐
│ S01E08 · Father's Day          scene 7/10       │
├────────────────────────────────────────────────┤
│        timeline graph (TARDIS = HEAD)          │
├──────────────────────────────┬─────────────────┤
│ $ git rebase prime-t▌imeline │ raw git output  │
│   caption                    │                 │
└──────────────────────────────┴─────────────────┘
```

### Keys

| Key     | Action                                                                                |
|---------|---------------------------------------------------------------------------------------|
| `→`     | Next reveal image / story card / scene (when the command input is empty or unfocused) |
| `←`     | Previous reveal image / story card / scene                                            |
| `Esc`   | Unfocus the command input                                                             |
| `Enter` | Run the typed command                                                                 |
| `Tab`   | Accept the ghost-text cue                                                             |
| `r`     | Reset the current scene to its snapshot (command input unfocused)                     |

## Assets

- BBC stills live under `assets/`, committed. A handful of stills per scene, no video.

## Out of scope (v1)

- Presenter view on a second screen.
- Audience participation.
- 3D renderer (planned after v1).

## Testing

- Scene builds: each produces the expected refs, HEAD and commit hashes (deterministic).
- Graph model: parsing git output into the JSON model for every scene snapshot.
- Each scene's cue `steps`, run in order against its snapshot, succeed.
- Renderer: model → expected lanes / nodes / tag / HEAD position.
