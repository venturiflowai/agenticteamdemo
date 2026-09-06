#!/usr/bin/env bash
# The agent must never edit the requirement it is being measured against.
#
# Without this, an implementer that cannot satisfy a criterion can quietly reword the
# criterion, and every downstream check will pass. This is the single most important
# deterministic control in the repository.
input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
[ -z "$path" ] && exit 0

case "$path" in
  */docs/intent/*|*/docs/feature/*)
    echo "Blocked: $path is a committed requirement. An agent cannot edit an intent or a feature definition. If the intent is wrong, stop and say so in your summary so a human can change it." >&2
    exit 2
    ;;
esac

if [ "${FIX_TASK:-0}" = "1" ]; then
  case "$path" in
    */tests/*|*.test.*|*.spec.*)
      echo "Blocked: tests cannot be edited during a fix task. Fix the code, not the test." >&2
      exit 2
      ;;
  esac
fi
exit 0
