# Wibbly Wobbly Git Schwifty

*Time travel with branches, merges and the occasional paradox.*

A 50-minute presented git session built on the revived Doctor Who (2005, "Rose", onwards).
The repo *is* the timeline: commits are episodes, `HEAD` is where the TARDIS sits, branches are
parallel universes. It runs live through a custom web app — the TARDIS Console — not slides.
Every command is typed on stage against a real throwaway repo. Take-home: this public repo.

## Run of show

One continuous timeline, ten scenes. The basics come fast; the later scenes are specials for the
experienced.

| #  | Scene                 | Git                                                                 | Doctor Who                                               |
|----|-----------------------|---------------------------------------------------------------------|----------------------------------------------------------|
| 1  | Rose                  | `init`, `add`, `commit`, aliases, `HEAD`                            | The timeline begins; HEAD = where the TARDIS is          |
| 2  | Father's Day          | `tag` (fixed point), `switch -c`, failing `merge`, `merge --abort`  | Rose saves Pete; dead-and-alive paradox, the Reapers come |
| 3  | The Parting of the Ways | `commit --amend`                                                  | Regeneration: same episode, new face, new hash           |
| 4  | Pete's World          | `switch -c` off `HEAD~3`                                            | A parallel universe splits off                           |
| 5  | Journey's End         | `merge` + conflict resolve, `rerere`                               | Universes collide, the Doctor-Donna                      |
| 6  | Blink                 | `bisect start/bad/good/run/reset`                                  | Narrow down exactly when the Angels got in               |
| 7  | River's Diary         | `reflog`, detached `HEAD`                                          | Spoilers; nothing is truly lost                          |
| 8  | Bad Wolf              | `log --grep`, `log -S`, `blame`                                    | A message scattered through time, traced to its author   |
| 9  | Turn Left             | `reset --hard/--soft`, `cherry-pick`, `restore --source`, `rebase --onto`, `rebase --rebase-merges` | The dark world, folded up and replayed onto the prime timeline |
| 10 | Outro                 | Recap: scene → command                                             | Q&A, repo link                                           |

## How it runs

- **TARDIS Console**: Bun + TypeScript backend, React frontend, localhost on the presenter's laptop.
- **Real git underneath**: the backend runs commands in a throwaway demo repo.
- **Scenes are data**: each scene is a `build` script (deterministic starting state) plus `steps`
  (the live cues). The presenter types each command; the next one shows as ghost text.
- **Deterministic**: builds run with fixed author/committer dates, so hashes are identical every run.
- **Graph**: the backend exposes the repo as one JSON model; a flat 2D SVG renderer draws lanes
  (one per universe), episode nodes, gold-star fixed points, and the TARDIS at HEAD.

Full detail: [`docs/superpowers/specs/2026-10-11-tardis-console-design.md`](docs/superpowers/specs/2026-10-11-tardis-console-design.md).

## Guidelines

- Every scene must make sense without knowing the show.
- Doctor Who time is wibbly wobbly; git semantics stay strict. The show is flavour, not the model.
- One running storyline: this repo *is* the timeline.
- Default timeline branch: `prime-timeline`, starting at "Rose".

## Parked — ideas for later

Not in the current cut; kept for a future version.

- **Pompeii as a standalone fixed-points scene** — folded into Father's Day's `fixed-point/pete` tag.
- **A dedicated cherry-pick scene** (River and the Doctor meeting out of order) — cherry-pick now
  lives inside Turn Left.
- **Interactive rebase.**
- **3D renderer** (react-three-fiber), behind the same graph model.
- **Presenter view** on a second screen.
- **Audience participation / hands-on mode.**
