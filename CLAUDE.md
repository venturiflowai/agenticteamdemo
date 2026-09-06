# CLAUDE.md

Guidance for agents working in this repository.

## The four commands

- `make build` — builds the `app` and `api` container images via `docker compose build`.
  Fails if either Dockerfile or its dependencies are broken.
- `make lint` — runs ESLint for `app/` and `api/` inside ephemeral `node:22-alpine`
  containers. No local Node install required.
- `make test` — runs the Vitest unit suites for `app/` and `api/`, same way as `lint`.
- `make verify` — starts the full stack with `docker compose up -d --build`, waits for
  `GET /api/health` to return 200, asserts neither container runs as root, runs the
  Playwright smoke tests this story owns, then tears the stack down with
  `docker compose down`. Exits non-zero if any step fails, and prints the last container
  logs if the health check times out.

Run `make build`, `make lint`, `make test`, and `make verify` locally before opening a
pull request. CI (`.github/workflows/ci.yml`) runs the same four commands on every pull
request.

## Directory conventions

- `app/` — the Vite + React frontend. Built and served by nginx in production.
- `api/` — the Express backend. Exposes `GET /health`.
- `infra/` — Helm charts and other cluster provisioning, once they exist. Empty for now.
- `docs/` — intents, plans, and reference docs such as this file's companions.
- `tests/` — the one Playwright spec suite, shared across all checkpoints. See
  `docs/TESTING.md`.
- `scripts/` — one-off operational scripts that do not belong to `app/` or `api/`.

## Rules

- Tests are never edited to make them pass. If a test fails, fix the code it is testing.
  A test is only ever changed to reflect a genuine change in what the code is supposed to
  do, and that change should be reviewed as carefully as the code change itself.
