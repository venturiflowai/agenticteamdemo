---
id: US-0006
title: Production release gate and smoke tests
feature: F-001
type: enabler
depends_on: [US-0005]
issue: 10
status: draft
---

# Intent: production release gate and smoke tests

## Problem
Nothing reaches production yet, and when it does there is no human decision point and no
proof that the release landed.

## Proposed outcome
After a successful dev deployment and test run, a production deployment waits for a named
human to approve it. Once approved, it deploys, proves the release is live with a limited
smoke run, and has a rehearsed way back if it is not.

## Acceptance criteria
1. The production deployment job depends on the dev job succeeding, and cannot run if the
   dev test run failed.
2. The job is bound to a GitHub environment with a protection rule naming a required
   reviewer. The job waits in a pending state until approved.
3. The approval prompt is actionable from the GitHub mobile app.
4. On approval, the workflow runs `helm upgrade` against `aks-prod` with the same image
   tags that were tested in dev. It does not rebuild.
5. After rollout, it runs the Playwright suite against the production URL with the tag
   filter `@smoke` only.
6. One smoke assertion confirms that an unauthenticated request is redirected to Google
   rather than being served content.
7. One smoke assertion confirms the TLS certificate is valid and not within thirty days of
   expiry.
8. If smoke fails, the workflow fails and the documented rollback command is printed in
   the workflow summary.
9. `docs/RUNBOOK.md` documents the rollback, and it has been executed successfully at
   least once against dev before this story is considered done.

## Non-functional constraints
- The production namespace does not deploy the mock issuer. The API refuses to start if
  its configured issuer is not Google.
- The same image that was tested in dev is the image that goes to prod. Rebuilding between
  environments invalidates the dev test run.
- No `@e2e` or `@data` tagged tests run against production.

## Out of scope
Blue-green or canary deployment, WAF, autoscaling, alerting.

## Open questions
- Required reviewers on environments need a public repository or GitHub Enterprise. Which
  applies here?
- What is the production hostname?
