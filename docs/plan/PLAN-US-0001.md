---
plan_for: US-0001
intent: docs/intent/US-0001-repository-and-delivery-scaffold.md
---

# Plan: repository and delivery scaffold

## Note before the plan

This plan originally contained one unresolved fork (step 9 of Order of work), caused by a
conflict between this story's own "Out of scope" (no Google sign-in) and an assertion
already present in the pre-existing `tests/smoke.spec.ts` file, which this plan is not
free to delete or weaken. A human has reviewed both options in the G1 pull request and
chosen **Option B**: filter the Playwright invocation to this story's own two tests by
name. Step 9 below is updated to reflect that decision.

## Files that change

- `app/package.json` — new. Declares the Vite + React frontend, its build/lint/test
  scripts, and pinned dependency versions.
- `app/tsconfig.json` — new. TypeScript config for the frontend so `npm run build` and
  the editor agree on types.
- `app/vite.config.ts` — new. Vite + React plugin config; also configures the Vitest unit
  test runner used by `make test`.
- `app/index.html` — new. Vite entry HTML.
- `app/src/main.tsx` — new. React bootstrap that mounts `App`.
- `app/src/App.tsx` — new. Renders the application name and
  `import.meta.env.VITE_GIT_SHA`, the two pieces of content AC2 requires.
- `app/src/vite-env.d.ts` — new. Types `import.meta.env.VITE_GIT_SHA` so the build is
  type-clean.
- `app/src/App.test.tsx` — new. Vitest unit test asserting `App` renders the app name and
  the SHA text; this is what `make test` executes for the frontend.
- `app/eslint.config.js` — new. Minimal ESLint flat config for React + TypeScript, so
  `make lint` has real rules to fail against.
- `app/Dockerfile` — new. Multi-stage: `node:22-alpine` builder stage runs `npm ci` and
  `npm run build` with `VITE_GIT_SHA` as a build arg; runtime stage is
  `nginxinc/nginx-unprivileged:alpine`, which listens on an unprivileged port and does not
  run as root, satisfying AC4 without extra `USER` plumbing.
- `app/nginx.conf` — new. Serves the built static files at `/` and reverse-proxies
  `/api/` to the `api` service by its Compose service name, satisfying AC5.
- `app/.dockerignore` — new. Excludes `node_modules` and `dist` from the build context.
- `api/package.json` — new. Declares the Express backend, its build/lint/test scripts,
  and pinned dependency versions.
- `api/tsconfig.json` — new. TypeScript config for the backend.
- `api/src/server.ts` — new. Express app exposing `GET /health`, returning HTTP 200 and a
  JSON body with a `status` field and a `sha` field read from `process.env.GIT_SHA`.
- `api/src/server.test.ts` — new. Unit/integration test (supertest against the Express
  app in-process) asserting `/health` returns 200 with `status` and `sha` present; this is
  what `make test` executes for the backend.
- `api/eslint.config.js` — new. Minimal ESLint flat config for TypeScript, so `make lint`
  has real rules to fail against.
- `api/Dockerfile` — new. Multi-stage `node:22-alpine` build; final stage runs as the
  image's built-in non-root `node` user (`USER node`), satisfying AC4.
- `api/.dockerignore` — new. Excludes `node_modules` from the build context.
- `docker-compose.yml` — new, repo root. Defines the `app` service (build `./app`, build
  arg `GIT_SHA`, published on host port 8080) and the `api` service (build `./api`,
  runtime env `GIT_SHA`, no published host port — reached only through the `app`
  container's nginx proxy on the compose network), satisfying AC5.
- `Makefile` — new, repo root. Defines `build`, `test`, `lint`, and `verify` targets, all
  running inside containers (no local Node install required), satisfying AC6 and AC7. The
  `verify` target also asserts neither running container's effective user is root
  (`id -u` inside each container is non-zero), which is the automated proof for AC4.
- `.github/workflows/ci.yml` — new. Runs `make build`, `make lint`, `make test`, and
  `make verify` on every pull request; fails the check if any step fails; uploads the
  Playwright HTML report and traces as artifacts, satisfying AC9.
- `infra/README.md` — new. One line stating the directory is intentionally empty until
  Helm charts arrive (this story's own "Out of scope"), so the directory exists in git
  (git does not track empty directories) and its emptiness is explained rather than
  accidental, satisfying the `infra/` clause of AC1.
- `CLAUDE.md` — new, repo root. Documents the four `make` commands, the directory
  conventions (`app/`, `api/`, `infra/`, `docs/`, `tests/`, `scripts/`), and the rule that
  tests are never edited to make them pass. Kept under roughly one printed page,
  satisfying AC10.
- `tests/smoke.spec.ts` — modify (existing file, not created by this story). Strengthens
  two of the four existing assertions to check content this story is responsible for:
  the homepage test asserts the rendered text includes the application name and the
  build SHA (not merely that a heading is visible), and the health test asserts a `sha`
  field is present in the JSON body (not merely that `status` is truthy). The other two
  existing tests in this file (the sign-in-gate assertion and the TLS-certificate
  assertion) are **not** edited — see the fork in Order of work, step 9, for how
  `make verify` and CI relate to them.
- `.gitignore` — new, repo root. Excludes `node_modules`, build output (`dist`, `build`),
  Playwright artifacts (`test-results`, `playwright-report`, `tests/.auth`), and any
  `.env*` file, supporting the "no secrets, no committed `.env`" constraint.

No other files are planned. Anything else appearing in the implementation diff (for
example, lockfiles such as `app/package-lock.json` and `api/package-lock.json`, which are
a mechanical byproduct of running `npm install` and are expected to appear even though
they are not hand-written) should be treated as expected byproducts of the files above,
not as undeclared scope.

## Order of work

1. Confirm the starting state matches this plan's assumptions: no `app/`, `api/`,
   `infra/`, `CLAUDE.md`, or `.github/workflows/ci.yml` exist yet; `docker-compose.yml`
   and `Makefile` do not exist at the repo root; `tests/smoke.spec.ts`,
   `tests/playwright.config.ts`, `tests/README.md`, and `docs/TESTING.md` already exist
   and are not to be treated as this story's own creation.

2. Scaffold `api/` first, since `app/`'s Docker build proxies to it but does not depend on
   it at build time: `api/package.json`, `api/tsconfig.json`, `api/src/server.ts`
   (Express, `GET /health` returns `{ status: "ok", sha: process.env.GIT_SHA ?? "unknown" }`
   with HTTP 200), `api/src/server.test.ts`, `api/eslint.config.js`, `api/Dockerfile`
   (multi-stage, `node:22-alpine`, final stage `USER node`), `api/.dockerignore`.

3. Scaffold `app/`: `app/package.json`, `app/tsconfig.json`, `app/vite.config.ts`,
   `app/index.html`, `app/src/main.tsx`, `app/src/App.tsx` (renders the app name and
   `import.meta.env.VITE_GIT_SHA`), `app/src/vite-env.d.ts`, `app/src/App.test.tsx`,
   `app/eslint.config.js`, `app/nginx.conf` (serves `/`, proxies `/api/` to
   `http://api:<api-port>/`), `app/Dockerfile` (builder stage takes `VITE_GIT_SHA` as a
   build arg and runs `npm run build`; runtime stage is
   `nginxinc/nginx-unprivileged:alpine` serving the built files and the nginx config),
   `app/.dockerignore`.

4. Write `docker-compose.yml` at the repo root wiring both services: `app` published on
   host `8080` with build arg `GIT_SHA` sourced from the shell environment (default to a
   placeholder such as `dev` if unset); `api` with runtime environment `GIT_SHA`, no
   published host port, reachable from `app` only by its compose service name on the
   default compose network.

5. Write the root `Makefile` with `build`, `test`, `lint`, and `verify` targets. `build`
   runs `docker compose build`. `test` and `lint` run inside ephemeral
   `node:22-alpine` containers (or `docker compose run --rm --no-deps <service> npm run
   test|lint`) against `app/` and `api/` so nothing needs to be installed on the host.
   `verify` computes `GIT_SHA` from `git rev-parse --short HEAD`, runs
   `docker compose up -d --build`, polls `GET http://localhost:8080/api/health` until it
   returns 200 or a bounded timeout elapses (printing the last lines of
   `docker compose logs` and exiting non-zero if the timeout is hit), asserts neither
   container's effective user is root via `id -u`, runs the Playwright suite (see step 9
   for which tests), tears down with `docker compose down`, and propagates a non-zero
   exit code if any step failed.

6. Write the root `.gitignore` covering `node_modules`, build output, Playwright
   artifacts, and `.env*`.

7. Write `infra/README.md` stating the directory is intentionally empty at this stage.

8. Strengthen the two in-scope assertions in `tests/smoke.spec.ts` (homepage text check,
   health JSON `sha` field check) without touching the other two existing tests in that
   file or their tags.

9. **Resolved by human decision at G1: Option B.** Invoke
   `npx playwright test --grep "health endpoint responds|homepage renders"` inside the
   `Makefile`'s `verify` target and inside `.github/workflows/ci.yml`, running only the
   two tests this story is actually responsible for. The sign-in-gate and
   TLS-certificate tests in `tests/smoke.spec.ts` are left unexecuted anywhere for now;
   they are not edited or removed. This deviates from `docs/TESTING.md`'s stated rule of
   one unfiltered `@smoke` grep at every checkpoint, so the implementer must add a line to
   `docs/TESTING.md` (or a tracked follow-up note) recording that US-0006, which owns the
   sign-in gate and the TLS check per its own acceptance criteria, must widen this grep
   back to the full `@smoke` tag once those exist. Do not let this filter go unrecorded.

10. Once step 9 is resolved, finish the `Makefile` and write
    `.github/workflows/ci.yml` to run `make build`, `make lint`, `make test`, and
    `make verify` on every pull request, uploading the Playwright HTML report and any
    failure traces as workflow artifacts.

11. Write `CLAUDE.md` at the repo root: the four `make` commands and what each proves,
    the six top-level directories and what belongs in each, and the rule that tests are
    never edited to make them pass. Keep it to roughly one printed page.

12. Run `make build`, `make lint`, `make test`, and `make verify` locally in this
    environment before opening the pull request. If any fails for an environmental
    reason this plan did not anticipate (for example, no Docker daemon available, or no
    outbound registry access), stop and report that rather than working around it
    silently.

## Proof

| # | Acceptance criterion | Test | Notes |
|---|---|---|---|
| 1 | `app/`, `api/`, `infra/`, `docs/`, `tests/`, `scripts/` all exist | No single test. `docs/`, `tests/`, `scripts/` already exist and are unchanged by this story. `app/` and `api/` existence is exercised indirectly by `make build` succeeding (a missing directory or Dockerfile fails the build). `infra/` is an intentionally empty directory (this story's own "Out of scope" for Helm content); there is no meaningful automated test for an empty directory's existence beyond its presence in the diff. | Gap for the `infra/` clause: no automated test, verified by inspection only. |
| 2 | `app/` renders the app name and the build commit SHA | `tests/smoke.spec.ts` → `@smoke homepage renders` (strengthened per Files that change to assert the text) | |
| 3 | `api/` `GET /health` returns 200 with `status` and the build SHA | `tests/smoke.spec.ts` → `@smoke health endpoint responds` (strengthened to assert a `sha` field) | |
| 4 | Both have a Dockerfile on a slim base image; neither final image runs as root | `Makefile` `verify` target's `id -u` check against each running container | Base-image slimness itself (`node:22-alpine`, `nginx-unprivileged:alpine`) is verified by reading the Dockerfiles at G2, not by an automated test. |
| 5 | `docker-compose.yml` exposes the frontend on 8080 and proxies `/api` to the API | `tests/smoke.spec.ts` → `@smoke health endpoint responds`, which only succeeds if the compose network, the published port, and the nginx proxy are all correct | |
| 6 | `make verify` starts, waits for health, runs smoke tests, tears down; exits non-zero on failure; prints last container log lines on startup failure | Happy path: this story's own CI run of `make verify`. The failure-path behaviors (non-zero exit, log printing) are not exercised by a standing automated test — proving them would require deliberately breaking the stack, which is not something to leave as a permanent regression test. | Gap: verified by code review of the `Makefile`, not by an executed test. |
| 7 | `make build`, `make test`, `make lint` exist and exit non-zero on failure | Happy path: `app/src/App.test.tsx`, `api/src/server.test.ts` give `make test` real assertions to fail; `app/eslint.config.js`, `api/eslint.config.js` give `make lint` real rules to fail; `make build` fails if `docker compose build` fails. The "exit non-zero on failure" behavior itself relies on the underlying tools' (vitest, eslint, docker) default exit-code behavior rather than a dedicated test that intentionally breaks something. | Same class of gap as row 6. |
| 8 | `tests/` contains a rendering spec and a health spec | The existing `tests/smoke.spec.ts` file itself, as strengthened | This criterion is the artifact, not something a separate test proves. |
| 9 | CI runs build, test, lint, verify on every PR and fails the check on failure | This story's own pull request, observed running `.github/workflows/ci.yml` | The "fails when any of them fails" half is proven by the workflow's default behavior (no `continue-on-error`, no `\|\| true`) on review, not by an executed failing run kept as a permanent test. |
| 10 | `CLAUDE.md` exists, is under one page, documents commands/conventions/the no-test-editing rule | File existence is checked trivially. "Documents X, Y, Z" and "under one page" are read and judged by a human at G1/G2 review; there is no automated test for prose completeness or page length as literally worded. | Not fully machine-testable as written; flagged rather than faked. Proceeding on the same basis the rest of this framework already uses human review for (G0–G3), rather than treating this alone as grounds to halt the plan. |

Row 9 of Order of work (the `@smoke` grep scope, resolved to Option B) governs the
specific invocation that appears in the `Makefile`/CI for rows 6 and 9 above.

## Risks

- Docker-in-Docker or outbound registry access may not be available in every session or
  CI runner. If `docker compose build` cannot reach the npm registry, Docker Hub (for
  `node:22-alpine`, `nginxinc/nginx-unprivileged`), this story's own CI run fails for
  environmental reasons unrelated to the code in this plan.
- Playwright browser binaries must be installed inside whatever environment runs
  `make verify`; a first run without a warmed cache can be slow enough to hit a CI
  timeout, independent of anything in this diff. `docs/BOOTSTRAP.md` calls this out as an
  expected diagnostic outcome of story one.
- Port 8080 must be free wherever `make verify` runs; a collision with another process in
  the same sandbox or runner fails startup for reasons outside these files.
- `tests/smoke.spec.ts` is shared, pre-existing, and will later gain real `@e2e` specs
  (US-0002/US-0003) and rely on the sign-in gate (US-0006). Any change to its two
  strengthened assertions must stay compatible with how those later stories extend the
  same file; over-tightening the wording now (for example, asserting an exact string
  match instead of a substring) could force an unnecessary edit later.
- `.claude/hooks/protect-intents.sh` blocks writes to `docs/intent/` and `docs/feature/`;
  nothing in this plan touches those paths, but an implementer must not "fix" the
  `US-0001` intent's front matter (for example, its `issue:` field) even incidentally.
- Option B (chosen at G1) means the sign-in-gate and TLS-certificate tests in
  `tests/smoke.spec.ts` run nowhere until a later story widens the grep. If that
  follow-up is dropped, those two tests stay silently unexecuted indefinitely; the
  implementer must record the follow-up (see step 9) so it is not lost.

## Deviations from plan

- Step 9's required follow-up note was recorded as a comment directly in `Makefile` and
  `.github/workflows/ci.yml` (stating that US-0006 must widen the Playwright grep back to
  the full `@smoke` tag once it lands), rather than in `docs/TESTING.md`. `docs/TESTING.md`
  is not in this plan's Files that change list, and editing it would have violated the
  "do not edit files outside the Files that change list" rule.
- Step 12 (run `make build`, `make lint`, `make test`, `make verify` locally before
  opening the pull request) could not be completed as specified. `npm run build`,
  `npm run lint`, and `npm run test` were run directly (not via `make`) for both `app/`
  and `api/` and all passed. The containerized `make` targets could not be validated in
  this session: every Docker Hub image pull (`node:22-alpine`, `docker/dockerfile:1`)
  returns 403 Forbidden. An independent `verifier` run confirmed this is an egress-policy
  denial for `production.cloudfront.docker.com` in this session's proxy, not a defect in
  the `Makefile`, `docker-compose.yml`, or the Dockerfiles. Per this plan's own Risks
  section, this is exactly the anticipated "Docker-in-Docker or outbound registry access
  may not be available" risk. Per instruction, this was reported rather than worked
  around (no alternate registry, no base-image substitution, no CA/proxy injection into
  the build). Containerized verification remains outstanding and should be re-run in an
  environment with Docker Hub access before this story is considered fully proven.
