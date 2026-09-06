#!/usr/bin/env bash
# Create GitHub issues from committed intent files, idempotently.
#
# The intent file is the artifact. The issue is the trigger and the conversation.
# This script is the only thing that creates issues, so creation is deterministic and
# rerunnable rather than something an agent does freehand.
#
# Rerunning is safe: a story whose front matter already has an issue number is skipped.
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
DRY="${DRY_RUN:-0}"

fm() { # fm <file> <key>
  awk -v k="$2" '
    /^---$/ {n++; next}
    n==1 && $0 ~ "^"k":" { sub("^"k":[[:space:]]*",""); print; exit }
  ' "$1"
}

set_fm() { # set_fm <file> <key> <value>
  awk -v k="$3" -v v="$4" '
    /^---$/ {n++}
    n==1 && $0 ~ "^"k":" { print k": "v; next }
    {print}
  ' "$2" > "$2.tmp" && mv "$2.tmp" "$2"
}

ensure_label() { # ensure_label <name> <color> <description>
  gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null 2>&1 || true
}

if [ "$DRY" != "1" ]; then
  ensure_label "feature"      "5319e7" "Parent feature tracked under docs/feature/"
  ensure_label "story"        "0e8a16" "Story tracked under docs/intent/"
  ensure_label "story:user"   "1d76db" "User-facing story"
  ensure_label "story:enabler" "fbca04" "Enabler story"
  ensure_label "intent:draft" "d4c5f9" "Intent not yet ready to dispatch"
  ensure_label "intent:ready" "c2e0c6" "Intent ready to dispatch"
fi

changed=0

# --- features first, so stories can reference the parent ---
for f in docs/feature/F-*.md; do
  [ -e "$f" ] || continue
  [ -n "$(fm "$f" issue)" ] && continue
  id=$(fm "$f" id); title=$(fm "$f" title)
  echo "creating feature issue for $id"
  [ "$DRY" = "1" ] && continue
  url=$(gh issue create --repo "$REPO" \
        --title "[$id] $title" \
        --label "feature" \
        --body "Feature definition: \`$f\`

Stories are tracked as sub-issues. The committed file is the source of truth; this issue is for discussion and status.")
  set_fm x "$f" issue "${url##*/}"
  changed=1
done

# --- stories ---
for f in docs/intent/US-*.md; do
  [ -e "$f" ] || continue
  [ -n "$(fm "$f" issue)" ] && continue
  id=$(fm "$f" id); title=$(fm "$f" title)
  type=$(fm "$f" type); status=$(fm "$f" status)
  feature=$(fm "$f" feature)
  parent=""
  for pf in docs/feature/F-*.md; do
    [ "$(fm "$pf" id)" = "$feature" ] && parent=$(fm "$pf" issue)
  done
  echo "creating story issue for $id (parent ${parent:-none})"
  [ "$DRY" = "1" ] && continue
  url=$(gh issue create --repo "$REPO" \
        --title "[$id] $title" \
        --label "story,story:$type,intent:$status" \
        --body "Intent: \`$f\`

Read the intent file for the problem, acceptance criteria, and constraints. Do not restate
them here; the committed file is the source of truth and the one the agent reads.

Parent feature: #${parent:-unknown}")
  num="${url##*/}"
  set_fm x "$f" issue "$num"
  if [ -n "$parent" ]; then
    gh api "repos/$REPO/issues/$parent/sub_issues" -f sub_issue_id="$(gh api "repos/$REPO/issues/$num" -q .id)" >/dev/null 2>&1 \
      || echo "  note: could not link as sub-issue, link it manually"
  fi
  changed=1
done

if [ "$changed" = "1" ] && [ "$DRY" != "1" ]; then
  git config user.name "sdlc-sync"
  git config user.email "sdlc-sync@users.noreply.github.com"
  git add docs/
  git commit -m "chore: record issue numbers on intent front matter"
  git push
fi
echo "sync complete"
