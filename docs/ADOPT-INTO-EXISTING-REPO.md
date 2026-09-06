# Adding this kit to a repository you have already started

Three collision points, handled deliberately. Run all of this in a Claude Code session on
the repository, or a Codespace. Nothing here needs a local machine.

## 1. Branch first

If you already turned on "require a pull request before merging", you cannot push to
`main`. Work on a branch either way.

```bash
git checkout -b chore/adopt-agent-kit
```

## 2. Unpack without clobbering

The kit contains a `README.md` you almost certainly do not want, and a
`.claude/settings.json` you may already have.

```bash
unzip -o bootstrap-kit.zip -d /tmp/kit

# safe to copy wholesale
cp -r /tmp/kit/bootstrap-kit/.claude .
cp -r /tmp/kit/bootstrap-kit/.github .
cp -r /tmp/kit/bootstrap-kit/scripts .
cp /tmp/kit/bootstrap-kit/docs/AGENT-TEAM.md docs/
cp /tmp/kit/bootstrap-kit/docs/BOOTSTRAP.md docs/
cp /tmp/kit/bootstrap-kit/docs/ADOPT-INTO-EXISTING-REPO.md docs/

# copy only if you do not already have your own
cp -n /tmp/kit/bootstrap-kit/docs/intent/_TEMPLATE.md docs/intent/
cp -n /tmp/kit/bootstrap-kit/docs/intent/US-0001-*.md docs/intent/
cp -n /tmp/kit/bootstrap-kit/docs/feature/F-001-*.md docs/feature/

# NOT the kit README
```

If you already have a `.claude/settings.json`, merge by hand rather than overwriting. The
part that matters is the `PreToolUse` hook entry pointing at `protect-intents.sh`.

## 3. Restore the executable bits

Git tracks the executable bit, and unzip does not always preserve it. A hook that is not
executable fails silently, which is the worst way for a control to fail.

```bash
chmod +x scripts/*.sh .claude/hooks/*.sh
git update-index --chmod=+x scripts/*.sh .claude/hooks/*.sh 2>/dev/null || true
```

Git does not track empty directories, so if you want `docs/plan/` to exist before the
planner runs:

```bash
mkdir -p docs/plan && touch docs/plan/.gitkeep
```

## 4. Reconcile the stories you already wrote

US-0002 and US-0003 predate the template, so their front matter probably does not match
what `sync-issues.sh` parses. Check before you sync:

```bash
./scripts/check-intents.sh
```

It reports missing front matter keys, missing sections, filenames that do not start with
the story id, and any story marked `ready` that still has open questions. Fix what it
lists. Adding the front matter block by hand takes a minute per file.

Two things it cannot check for you:

- **Numbering.** Story ids must be globally unique and stable. If you numbered from the
  feature rather than globally, renumber now while nothing references them.
- **Sizing.** If a story's acceptance criteria span the backend, the frontend, and
  authentication, it is more than one story. Split it before the planner sees it, not
  after you are reading a diff you cannot review in one sitting.

## 5. Backfill issue numbers before syncing

This is the step that bites. If you already created issues for US-0002 or US-0003 by hand,
put those numbers into the front matter now:

```yaml
issue: 7
```

`sync-issues.sh` skips any story that already has an issue number and creates one for any
story that does not. Backfilling is what prevents a duplicate set of issues appearing the
first time the workflow runs.

Then check what the sync would do, without doing it:

```bash
DRY_RUN=1 ./scripts/sync-issues.sh
```

Read that output carefully. It should propose creating exactly the issues you are missing
and nothing else.

## 6. Open the pull request

```bash
git add -A
git commit -m "chore: adopt agent team, hooks, and intent tooling"
git push -u origin HEAD
```

Merging it triggers the sync workflow, which creates any missing issues and commits the
numbers back to the front matter.

## 7. Sanity-check the hook before you trust it

The hook is the one non-advisory control in the repository, so confirm it actually fires.
In a session, ask Claude to make a trivial edit to any file under `docs/intent/`. It should
be blocked with the message from `protect-intents.sh`. If the edit succeeds, the hook is
not wired: check the executable bit and the path in `.claude/settings.json`.

Do this once. A control you assume is working is worse than no control, because you stop
looking.
