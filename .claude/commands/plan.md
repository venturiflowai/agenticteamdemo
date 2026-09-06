---
description: Turn a merged story intent into an implementation plan
---
Use the planner subagent on the intent file at $ARGUMENTS.

Follow its instructions exactly. Do not write code, do not create branches, do not modify
the intent. Commit the plan on a branch named `plan/<story-id>` and open a pull request
titled "Plan for <story-id> (G1)".

In the pull request body, list anything you were unsure about and any acceptance criterion
you could not map to a test. Put that at the top, not the bottom. It is what the reviewer
needs to read first.
