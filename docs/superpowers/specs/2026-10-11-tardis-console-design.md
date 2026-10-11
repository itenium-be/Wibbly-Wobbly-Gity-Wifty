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
| 00:00 | 4   | Cold open                    | —                                           | Who is the Doctor: TARDIS, companions, regeneration |
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
  story: { images: string[]; recap: string[] }; // episode recap → how it maps to git
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

Each scene: story cards (images + recap) → git phase (graph + command input).
The cold open is the Rose scene's story cards: Rose, the Doctor, the TARDIS, what the series is.

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

| Key     | Action                                                                     |
|---------|----------------------------------------------------------------------------|
| `→`     | Next story card / next scene (when the command input is empty or unfocused) |
| `←`     | Previous story card / previous scene                                        |
| `Esc`   | Unfocus the command input                                                   |
| `Enter` | Run the typed command                                                       |
| `Tab`   | Accept the ghost-text cue                                                   |
| `r`     | Reset the current scene to its snapshot (command input unfocused)           |

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
