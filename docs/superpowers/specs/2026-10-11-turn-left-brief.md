# Turn Left: brief

A new scene for Turn Left (S04E11). Constraints from the presenter; the design is still open.

## Constraints

- **Broadcast order on prime, from the start**: … The Parting of the Ways → The Runaway Bride (S03E00) → Blink → Forest of the Dead → **Turn Left (S04E11)** → The Stolen Earth (S04E12) → Journey's End.
  - The Runaway Bride and Turn Left are new episode commits in the existing history, not added at the end.
  - Git can rewrite anything: "it lands at the end" is never an acceptable consequence.
- **The change happens at The Runaway Bride.** The dark world visibly branches there; The Runaway Bride must matter on the timeline.
- **Turn Right is a red commit** on its own branch, followed by end-of-the-world commits (the Doctor dies fighting the Racnoss, the stars going out, …).
- **Rose comes from the parallel world.** Her commit originates on `petes-world` and arrives in the dark world from there, so `petes-world` must still exist: the scene sits before Journey's End.
- The scene should teach something more involved than a single command.

## Lore

Donna turns right in Chiswick, before The Runaway Bride. She never takes the job at H.C. Clements, isn't there at Christmas, and the Doctor dies drowning the Racnoss. Without him: the hospital on the Moon, the Titanic falls on London, the stars go out. Rose crosses over with a dimension cannon and sends Donna back to turn left. Her last words, "Bad Wolf", carry the warning into the real world, leading into The Stolen Earth.

## Knock-on changes

- Pete's World branches with `git switch -c petes-world HEAD~2`: the new prime commits shift that offset.
- Journey's End hard-codes the resolved TARDIS.md: it needs the new lines.
- Bad Wolf's `log -S "Bad Wolf"` test will also find Turn Left.
- Blink's bisect midpoints move with extra commits.
- The outro card lists each scene's git commands.

## Tooling

`bun prototype/new-scenes.gen.tsx [scenario]` replays the real scenes (optionally with an overridden scene list), runs a scenario's steps with real git, and renders every step with the app's own `layout` + `FlatTimeline`.
