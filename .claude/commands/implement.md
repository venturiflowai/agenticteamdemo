---
description: Execute an approved plan and prepare the pull request
---
The plan at $ARGUMENTS has been merged, which means a human approved it.

1. Use the implementer subagent to execute it.
2. Then use the verifier subagent. It reports; it does not fix.
3. If the verifier reports a failure, hand back to a human. Do not loop more than twice.
4. Commit on a branch named `build/<story-id>` and open a pull request titled
   "Implementation for <story-id> (G2)".

The pull request body must contain, in this order: the verifier's output, the list of
files changed, and any Deviations from plan entries. Do not summarize the verifier output;
paste it.

Do not merge. Do not approve.
