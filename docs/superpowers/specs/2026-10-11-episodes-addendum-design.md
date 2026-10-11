# Addendum: episodes, shell and a continuous timeline

Extends [the TARDIS console design](2026-10-11-tardis-console-design.md).
Layout, the working directory panel and projector font sizes are already built (branch `workdir-layout`).

## Concept order, one continuous timeline

- Scenes run in git-concept order, not broadcast order. `TARDIS.md` is the Doctor's own timeline: a time traveller doesn't live events in broadcast order.
- Each scene starts exactly where the previous one ended. A scene's snapshot = the previous snapshot + the previous scene's steps replayed.
- Only the first scene has a `build`; later scenes inherit.
- Replays use fixed commit dates, so snapshot hashes are stable. Live commits use the real clock.

## `TARDIS.md`

One running file, edited by every episode. It exists before `git init` (the Doctor existed before our timeline).

```md
# TARDIS log
Doctor: The Ninth Doctor
Companions:
- Rose Tyler
Location: London, 2005

Events:
- The Game Station is run by the Bad Wolf Corporation
```

An episode sets fields (`Key: value` lines, or `Key:` with a `- item` line per entry; replaced in place or appended after the last field) and can append an event under `Events:`.

### The Bad Wolf thread

Automatic episodes append a Bad Wolf event, one per episode, as the show does in Series 1.
Each sighting is its own line, so `git log -S "Bad Wolf"` lists every episode and `git blame TARDIS.md` attributes each line to its episode.

## Steps

```ts
type Episode = { code: string; title: string; set?: Record<string, string | string[]>; event?: string };
type Step =
  | { cmd: string; caption: string; fails?: true }   // presenter types it
  | { episode: Episode };                             // Next Episode: automatic edit + commit
```

- `fails`: the cue is expected to exit non-zero (e.g. `git status` before `git init`) and still advances.
- An episode step applies the edit to `TARDIS.md` and runs `git commit -am "<title>"`. The output pane shows that command and its output.

## Next Episode

- Slides in bottom-right, Netflix-style, as soon as the current step is an episode step: `S01E02 · The End of the World`.
- Plays after an 8s countdown, on click, or on `n`.
- Hidden while HEAD is detached: the commit would land on no branch.

## Shell

- Every console line runs through `bash -c` in the live repo: `ls`, `cat TARDIS.md | head`, ….
- No TTY: `PAGER=cat`, `GIT_PAGER=cat`, `GIT_EDITOR=true`.
- Console lines run with `color.ui=always`; the output pane renders the ANSI colours.

## Git config and aliases

- A fresh git install on stage: `GIT_CONFIG_GLOBAL` points to a per-snapshot copy of `server/tardis.gitconfig` (name, email, default branch only). The checked-in file is never written to.
- `git config --global alias.st status` is a typed cue. The alias lives in the snapshot's config, so it carries into later scenes by continuity.
- Lore aliases for later scenes: `tardis` = `log --oneline --graph --all`, `regenerate` = `commit --amend --no-edit`, `spoilers` = `reflog`, `exterminate` = `reset --hard`, `geronimo` = `push --force`.

## Timeline

- A dashed "uncommitted" node after HEAD (in HEAD's lane) while the working directory has changes.

## Scenes in this addendum

### Rose (S01E01)

Story: the cold-open cards, then one Rose card. Narrate while typing; no recap.

| # | Step                                      | Caption                                       |
|---|-------------------------------------------|-----------------------------------------------|
| 1 | `git status` (fails)                      | No timeline yet                               |
| 2 | `git init`                                | Every timeline has to start somewhere         |
| 3 | `git status`                              | The TARDIS log exists, but nobody tracks it   |
| 4 | `git config --global alias.st status`     | We'll be asking this a lot                    |
| 5 | `git add TARDIS.md`                       | Stage the log                                 |
| 6 | `git st`                                  | Ready to become history                       |
| 7 | `git commit -m "Rose"`                    | S01E01: the first event in the timeline       |
| 8 | `git log`                                 | HEAD: where the TARDIS is right now           |
| 9 | Next Episode: S01E02 The End of the World | Location: Platform One; "the Bad Wolf scenario" |

### The Fires of Pompeii (S04E02)

| #  | Step                                         |
|----|----------------------------------------------|
| 1  | Next Episode: S01E04 Aliens of London (Bad Wolf graffiti on the TARDIS) |
| 2  | Next Episode: S01E06 Dalek (Bad Wolf One)    |
| 3  | Next Episode: S02E00 The Christmas Invasion (Doctor: Tenth) |
| 4  | Next Episode: S04E01 Partners in Crime (Companion: Donna) |
| 5  | Next Episode: S04E02 The Fires of Pompeii    |
| 6  | `git tag fixed-point/pompeii`                |
| 7  | Next Episode: S04E03 Planet of the Ood       |
| 8  | Next Episode: S04E04 The Sontaran Stratagem  |
| 9  | `git log --oneline`                          |
| 10 | `git checkout fixed-point/pompeii` (detached HEAD) |
| 11 | `cat TARDIS.md`                              |
| 12 | `git switch prime-timeline`                  |

## Later scenes (not in this addendum)

Father's Day, designed: `origin` (bare) + an `earth` clone; Next Episode "Father's Day" → `push` → earth builds on it → edit `Pete Tyler: alive` → `commit --amend` → `push` rejected → `push --force` → earth `pull` fails (the Reapers) → earth `log --graph --all` → earth `push --force` (Pete's sacrifice) → `fetch` + `reset --hard`.

Open: where rebase goes (or drop it); whether `earth` gets its own graph; the "merge in progress" node (Journey's End).
