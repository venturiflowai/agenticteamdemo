#!/usr/bin/env bash
# Validate that every intent and feature file has usable front matter.
#
# Run this before sync-issues.sh. The sync script parses front matter, so a file that
# predates the template will be silently skipped or half-processed rather than failing
# loudly. This makes that failure loud.
set -uo pipefail

fail=0
note() { echo "  $1"; fail=1; }

fm() { # fm <file> <key>
  awk -v k="$2" '
    /^---$/ {n++; next}
    n==1 && $0 ~ "^"k":" { sub("^"k":[[:space:]]*",""); print; exit }
  ' "$1"
}

has_section() { grep -qE "^## $2\b" "$1"; }

echo "checking feature files"
for f in docs/feature/F-*.md; do
  [ -e "$f" ] || continue
  echo "- $f"
  [ -n "$(fm "$f" id)" ]    || note "missing front matter: id"
  [ -n "$(fm "$f" title)" ] || note "missing front matter: title"
  grep -q "^issue:" "$f"    || note "missing front matter key: issue (leave the value empty)"
done

echo "checking intent files"
for f in docs/intent/US-*.md; do
  [ -e "$f" ] || continue
  echo "- $f"
  id=$(fm "$f" id)
  [ -n "$id" ] || note "missing front matter: id"
  base=$(basename "$f")
  [ -n "$id" ] && [[ "$base" == "$id"-* ]] || note "filename should start with the id, e.g. ${id:-US-0000}-slug.md"
  [ -n "$(fm "$f" title)" ]   || note "missing front matter: title"
  [ -n "$(fm "$f" feature)" ] || note "missing front matter: feature"
  t=$(fm "$f" type)
  case "$t" in user|enabler) ;; *) note "type must be user or enabler, found '${t:-empty}'";; esac
  s=$(fm "$f" status)
  case "$s" in ready|draft) ;; *) note "status must be ready or draft, found '${s:-empty}'";; esac
  grep -q "^issue:"      "$f" || note "missing front matter key: issue (leave the value empty until synced)"
  grep -q "^depends_on:" "$f" || note "missing front matter key: depends_on (use [] when none)"

  for sec in "Problem" "Proposed outcome" "Acceptance criteria" "Out of scope" "Open questions"; do
    has_section "$f" "$sec" || note "missing section: ## $sec"
  done

  grep -qE "^[0-9]+\." "$f" || note "acceptance criteria should be a numbered list"

  if [ "$s" = "ready" ]; then
    oq=$(awk '/^## Open questions/{flag=1;next} /^## /{flag=0} flag' "$f" \
         | grep -vE '^[[:space:]]*$' | grep -viE '^none\b' | head -1)
    [ -z "$oq" ] || note "status is ready but Open questions still lists: $oq"
  fi
done

if [ "$fail" = "1" ]; then
  echo
  echo "intent check failed. Fix the items above before running sync-issues.sh."
  exit 1
fi
echo
echo "intent check passed"
