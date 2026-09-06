# The agent team

Five agents, each in its own context window, arranged around three human gates.

| Agent | Reads | Writes | Runs when |
|---|---|---|---|
| `planner` | intent, CLAUDE.md | `docs/plan/` | Intent merged (after G0) |
| `implementer` | plan only | source, tests | Plan merged (after G1) |
| `verifier` | plan, running app | nothing | Implementer reports done |
| `plan-compliance` | intent, plan, diff | nothing | Pull request opened |
| `security-review` | diff | nothing | Pull request opened |

## Why five and not one

The agent that writes the code does not judge the code. The agents that judge it never saw
the session that produced it, so they do not inherit its assumptions or its blind spots.
One large reviewer shares a single context and a single set of biases; three narrow ones do
not, and if one is wrong another can catch it.

The implementer reads the plan, not the intent. That is deliberate. If it read the intent
it would re-derive its own approach and the plan you approved would stop being the thing
that gets built.

## The gates

| Gate | You decide | Mechanism |
|---|---|---|
| G0 | Is this the right thing to build? | Merge of the intent pull request |
| G1 | Is this the right way to build it? | Merge of the plan pull request |
| G2 | Is this correct, in scope, and safe? | Merge of the implementation pull request |
| G3 | Is now the right time to release? | Environment protection rule on production |

An agent never clears a gate. At the end of its run it hands back and stops.

## The one control that is not advisory

`protect-intents.sh` blocks any agent edit to `docs/intent/` and `docs/feature/`. Without
it, an implementer that cannot satisfy an acceptance criterion can reword the criterion,
and every check downstream will pass. Everything else in this repository is a strong
suggestion. This one is a wall.

The same hook blocks test edits when `FIX_TASK=1`, so an agent fixing a bug cannot weaken
the test that proves the bug is gone.

## Escalation

An agent stops and hands back when any of these is true. These are not negotiable per
story.

- It needs a file outside the plan.
- An acceptance criterion is not testable as written.
- The intent is ambiguous enough that two reasonable implementations exist.
- A check fails for a reason the plan did not anticipate.
- It needs a permission it does not have.
- Its own verification did not run cleanly.

Silence is not consent. An agent that cannot proceed says so rather than picking the
interpretation that lets it finish.
