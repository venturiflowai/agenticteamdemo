---
id: US-0005
title: Delivery pipeline to the dev namespace
feature: F-001
type: enabler
depends_on: [US-0001]
issue: 9
status: draft
---

# Intent: delivery pipeline to the dev namespace

## Problem
A change that passes CI has only been proven to work under Docker Compose. Nothing proves
it works when deployed: ingress routing, TLS, DNS, image pulls, and per-environment
configuration are all untested until something is actually running in the cluster.

## Proposed outcome
Merging to `main` deploys to the dev namespace automatically and proves the deployment
works by running the test suite against the real dev URL. A failure there stops the change
from being eligible for production.

## Acceptance criteria
1. A CD workflow runs on merge to `main`.
2. The workflow authenticates to Azure using GitHub OIDC federated credentials. No cloud
   secret is stored in the repository or in Actions secrets.
3. It builds both images, tags them with the commit SHA, and pushes them to the container
   registry.
4. It runs `helm upgrade` against the `aks-dev` namespace using the pushed tags, and waits
   for the rollout to complete before continuing.
5. After rollout, it runs the Playwright suite with `PLAYWRIGHT_BASE_URL` set to the dev
   ingress URL and the tag filter `@smoke @e2e @data`.
6. The Playwright HTML report and any failure traces are uploaded as workflow artifacts.
7. If the rollout or the test run fails, the workflow fails and no production deployment
   becomes available.
8. The workflow summary states the deployed commit SHA, the dev URL, and the test counts,
   so the result is readable without opening the logs.

## Non-functional constraints
- The dev namespace deploys the mock OIDC issuer. The API's issuer configuration points at
  it. No Google credentials are used in dev.
- Rollout waits must have a bounded timeout. A hung rollout fails rather than running
  until the job limit.
- The workflow must be readable on a phone: verdict in the summary, not in the logs.

## Out of scope
The production namespace, the production gate, prod smoke tests, rollback.

## Open questions
- What is the dev hostname, and is its DNS record created?
- Which resource group and cluster name does the workflow target?
