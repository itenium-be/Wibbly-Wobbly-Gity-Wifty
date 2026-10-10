# Wibbly Wobbly Git-y Wifty

*Time travel with branches, merges and the occasional paradox.*

A git session using the revived Doctor Who series (2005, "Rose", onwards) as the repository. The commit history is the timeline; the TARDIS is how we move through it.

## Concept mapping

| Git | Doctor Who |
|---|---|
| Commit | An episode / event. Once it happened, it's in the timeline. |
| `HEAD` | Where the TARDIS currently is. |
| `checkout <old commit>` / detached HEAD | Travelling to the past. Look around, but "you can't rewrite history, not one line". Changes are lost unless you branch. |
| Tag | Fixed points in time (Pompeii, Bowie Base One, Captain Jack). They never move. |
| Branch | Parallel universe: Pete's World, *Turn Left*. |
| Merge | *Journey's End*: universes collide, the Doctor-Donna. |
| Merge conflict | *Day of the Doctor*: three Doctors, incompatible memories, resolved manually. |
| Rebase / force-push | *Father's Day*: Rose rewrites shared history and the Reapers arrive. Don't rewrite public history. |
| Reflog | River's diary. Nothing is truly lost. Spoilers. |
| Cherry-pick | River and the Doctor meeting out of order. |
| `blame` / `log --grep` | *Bad Wolf*: a message scattered through time, traced back to its author. |
| `bisect` | *Blink*: narrow down exactly when it went wrong. |

## Structure

**Main show:** commit → branch → merge → tag

**Specials (side shows):**
- Rebase: *Father's Day*
- Reflog: River's diary
- Bisect: *Blink*

## Guidelines

- Every scene must make sense without knowing the show.
- Doctor Who time is wibbly wobbly; git semantics stay strict. The show is flavour, not the model.
- One running storyline: this repo *is* the timeline.
- Default timeline branch: `prime-timeline`, starting at "Rose".
