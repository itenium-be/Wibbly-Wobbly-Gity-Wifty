# Wibbly Wobbly Git-y Wifty

*Beware! Lots of Wibbly wobbly, timey wimey… stuff going on in this session.*

## Abstract

Somewhere in your history, the Weeping Angels got in. You don't know when. You blinked.

Git is a time machine, and so is the TARDIS. This session replays the Doctor's adventures
as a live git repository. It is the only way really, we as developers, can make any sense
of all the time travel happening within Doctor Who.

Fixed points in time, parallel and crashing universes, and the occasional paradox,
nothing git can't handle really.

Universes will collide in a merge conflict. `bisect` will hunt down the exact episode where the
Angels slipped in. A `rebase` and force-push will tear a paradox through everyone else's timeline,
and `reflog` will prove that, just this once, everybody lives.

There are new commands: git switch (others?) instead of git checkout
--> we should maybe take that in the elevatorpitch as well...



## Target Audience

Developers who use git every day, from those who know commit/push/pull to those who rebase without fear.
The basics are a quick refresher; the specials are for the experienced.

## Key Takeaways

- A commit is a fixed event in the timeline; branches and tags are just names pointing at one
- Detached `HEAD` is travelling to the past: look around, but branch before you change anything
- `bisect` finds the commit that broke it in log₂(n) steps, and `bisect run` makes it automatic
- Rewriting shared history (`rebase` + `push --force`) breaks everyone else's timeline
- `reflog` remembers everywhere `HEAD` has been, so a bad `reset --hard` can be undone

## Session Format

50 minutes, presented live inside a TARDIS console
