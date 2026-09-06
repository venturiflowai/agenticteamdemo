---
id: US-0001
title: Repository and delivery scaffold
feature: F-001
type: enabler
depends_on: []
issue: 6
status: ready
---

# Intent: repository and delivery scaffold

## Problem
There is no repository structure, no build tooling, and no way to verify that a change
works. Until one command can start the application and prove it responds, no agent can
check its own work, and every change lands on a human to validate by hand.

## Proposed outcome
A repository an agent can work in productively from its first session: a predictable
layout, a containerized frontend and API that run together, and one command that starts
everything, proves it is healthy, and tears it down.

The application at this stage is a skeleton. It renders a page and answers a health
check. No product functionality.

## Acceptance criteria
1. The repository contains `app/` for the frontend, `api/` for the backend, `infra/` for
   Helm charts and manifests, `docs/` for intents and plans, `tests/` for end to end
   specs, and `scripts/` for tooling.
2. `app/` builds a React application with Vite that renders a page showing the
   application name and the build commit SHA.
3. `api/` runs an Express service exposing `GET /health`, returning HTTP 200 with a JSON
   body containing a status field and the build commit SHA.
4. Both have a Dockerfile using a slim base image. Neither final image runs as root.
5. `docker-compose.yml` starts both containers, exposes the frontend on port 8080, and
   proxies `/api` to the API service.
6. `make verify` starts the containers, waits for the health endpoint, runs the smoke
   tests, and tears the containers down. It exits non-zero if any step fails and prints
   the last lines of container logs when startup fails.
7. `make build`, `make test`, and `make lint` each exist and exit non-zero on failure.
8. `tests/` contains a Playwright spec asserting the frontend page renders over HTTP,
   and a spec asserting the health endpoint returns 200.
9. A GitHub Actions workflow runs build, test, lint, and verify on every pull request,
   and fails the check when any of them fails.
10. `CLAUDE.md` exists at the repository root, is under one page, and documents the
    commands, the directory conventions, and the rule that tests are never edited to
    make them pass.

## Non-functional constraints
- `make verify` runs against containers, not bare processes. Working outside a container
  is not evidence that it works.
- No secrets in the repository. No committed `.env`, no credentials in any workflow.
- Slim base images, such as `node:22-alpine` or a distroless runtime, to keep unfixed CVE
  noise near zero.
- Everything must run in a cloud session with no local installation.

## Out of scope
Azure provisioning, Helm chart contents beyond an empty `infra/`, Google sign-in, any
product functionality, any persistence.

## Open questions
None. This story is ready to dispatch.
