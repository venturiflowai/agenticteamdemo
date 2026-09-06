# Bootstrap: from empty repository to first dispatched story

Everything below runs in a browser. The only step that is not a Claude Code session is
creating the repository itself, because a session needs a repository to attach to.

## Step 0. By hand, about ten minutes

1. Create an empty private repository on github.com. Add a README so it is not empty.
2. Settings, Branches: add a rule for `main`. Require a pull request before merging.
   Leave required approvals at zero for now, since you cannot approve your own PR.
   Once agents author PRs, raise it to one, because then the author is not you.
3. Settings, Environments: create `production`. Add yourself as a required reviewer.
   Verify the approval prompt appears in the GitHub mobile app before you rely on it.
4. Settings, Actions, General: set workflow permissions to read and write.
5. Copy this kit into the repository on a branch and merge it.

That is the entire manual footprint. Everything after this is session work.

## Step 1. Author the intents

Open a Claude Code session on the repository at claude.ai/code. Ask it to use the
`intent-capture` skill and describe your feature in plain language. Answer its questions.
Let it write one file per story under `docs/intent/`.

US-0001 is already written and marked ready. Do not let the session rewrite it. Point the
session at the remaining stories once you have chosen the use case.

Read what it produced. This reading is gate G0, and it is the highest-leverage twenty
minutes in the whole process, because every later stage inherits whatever is wrong here.

Check specifically:
- Is every acceptance criterion testable as written?
- Is Out of scope populated? An empty one means the agent will drift.
- Are there open questions the session quietly resolved by assumption?

Merge the PR. Merging is your acceptance.

## Step 2. Issues appear

The `sync-issues` workflow runs on merge, creates the feature issue and one issue per
story, links the stories as sub-issues, and commits the issue numbers back into the front
matter. Rerunning is safe; a story with an issue number is skipped.

Run it with `DRY_RUN=1` first if you want to see what it would create.

## Step 3. Dispatch US-0001

Open a new session on the repository and run:

```
/plan docs/intent/US-0001-repository-and-delivery-scaffold.md
```

The planner writes `docs/plan/PLAN-US-0001.md` and opens a pull request. It writes no
code. Read the plan. This is G1, and the two things to look for are an acceptance
criterion with no test mapped to it, and files it plans to create that the intent did not
ask for. Merge when you are satisfied.

Then run:

```
/implement docs/plan/PLAN-US-0001.md
```

The implementer executes the plan, the verifier runs `make verify` and reports, and a pull
request opens with the verifier output pasted into the body. On that pull request the
plan-compliance and security-review agents post separately.

Read plan-compliance first, specifically its third list: what is in the diff but not in the
plan. That list is where scope creep and unrecorded decisions live. Merge when it is clean.
That is G2.

Note that US-0001 is the one story where the verifier has nothing to run until the
implementer has built `make verify` itself. That is expected. From US-0002 onward the
verifier runs against a command that already exists.

## Step 4. What you will learn from story one

Story one is diagnostic. Pay attention to:
- Did `make verify` work on the first CI run, or did containers, ports, or the proxy need
  fixing? That gap is exactly the afternoon you would otherwise have lost later.
- Was the diff reviewable in one sitting? If not, your stories are too big and story two
  should be split.
- Did the agent invent structure the intent did not specify? That is a signal your intent
  needs a firmer Out of scope, not that the agent misbehaved.

Fix the intent template and `CLAUDE.md` based on what you learn, before dispatching story
two. The corrections compound.

## What comes after

Stories two and three are blocked until the use case is chosen. Story four depends on
both. Azure provisioning is a separate track that can proceed in parallel with story one,
since nothing in the scaffold depends on a cluster existing.
