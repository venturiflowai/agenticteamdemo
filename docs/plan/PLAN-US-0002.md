---
plan_for: US-0002
intent: docs/intent/US-0002-claims-api-and-seed-data.md
---

# Plan: workers' compensation claims API and seed data

## Note before the plan

This plan originally contained one unresolved fork in Order of work (step 6), the same
kind US-0001 hit at its own step 9: whether the one Playwright test needed to prove the
literal `GET /api/claims` external contract belongs inside the existing name-filtered
`make verify` grep, or should be proven only at the Vitest/supertest level. A human has
reviewed both options in the G1 pull request and chosen **Option 1**: add the Playwright
test and widen the grep. Step 6 below is updated to reflect that decision.

## Files that change

Unconditional (needed regardless of how the step 6 fork is resolved):

- `api/src/data/claims.seed.json` — new. Static, in-memory-loaded seed dataset of 25
  workers' compensation claim records, each with `claimId`, `claimantName`, `employer`,
  `dateOfInjury`, `injuryType`, `bodyPart`, `status`, `description`, `adjusterNotes`,
  satisfying AC2 and AC4. Ordered deterministically (ascending `claimId`) so page slices
  are stable and testable.
- `api/src/claims.ts` — new. Loads the seed JSON at module load, exposes a pure pagination
  helper (page, fixed page size 10, total records → slice + `page` + `totalPages` +
  `totalRecords`) that treats a missing or invalid `page` as `1` and a `page` beyond
  `totalPages` as a valid request returning an empty slice, and exports an Express
  `Router` mounting `GET /claims` (not `/claims/api` and not `/api/claims` — the api
  container's own routes are unprefixed, exactly like the existing `/health` route; the
  `/api/` prefix is added only by `app/nginx.conf`'s reverse proxy, which forwards
  `/api/<anything>` to `http://api:3000/<anything>` already, unmodified by this story).
- `api/src/server.ts` — modify (existing file from US-0001). Imports and mounts the new
  claims router alongside the existing `/health` route. No change to `/health` itself.
- `api/src/claims.test.ts` — new. Vitest + supertest tests against the in-process `app`
  export from `server.ts` (same pattern as `api/src/server.test.ts`), one test per
  acceptance criterion — see Proof.

Resolved by G1 decision (Option 1):

- `tests/smoke.spec.ts` — modify (existing, shared, pre-existing file, not owned by this
  story alone). Adds one new test that hits `GET /api/claims` through the real compose
  network (mirroring the existing `@smoke health endpoint responds` test's use of the
  `request` fixture), proving the nginx `/api/` → api container proxy carries this story's
  route end to end, which no Vitest test can prove because Vitest calls the Express `app`
  object directly and never goes through nginx.
- `Makefile` — modify. Widens the `--grep` filter in the `verify` target's Playwright
  invocation to also match this story's new test by name, following the exact precedent
  recorded in `docs/plan/PLAN-US-0001.md` step 9 (Option B).
- `.github/workflows/ci.yml` — modify. Updates the comment above the `make verify` step to
  mention the widened grep, matching the existing comment style.

No other files are planned. `app/` is not touched: `app/nginx.conf`'s existing
`location /api/ { proxy_pass http://api:3000/; }` block already forwards any path under
`/api/`, including `/api/claims`, without modification, and this story is explicitly
API-only (the UI that consumes this endpoint is US-0003, out of scope here).

## Order of work

1. Confirm the starting state matches this plan's assumptions: `api/src/server.ts`
   currently exposes only `GET /health`; no `api/src/claims.ts` or
   `api/src/data/claims.seed.json` exist yet; `app/nginx.conf`'s `/api/` proxy block is
   already generic and requires no change.

2. Write `api/src/data/claims.seed.json`: exactly 25 claim records, each a distinct
   `claimId`, and each containing all nine fields AC2 requires. No two records may be
   identical, since AC5 requires no record repeated across pages.

3. Write `api/src/claims.ts`: a pagination helper taking a raw `page` query value (string,
   undefined, or otherwise) and returning `{ claims, page, totalPages, totalRecords }`
   with page size fixed at 10; missing or non-positive/non-numeric `page` values default
   to `1`; a `page` greater than `totalPages` returns an empty `claims` array with the
   requested `page` number still echoed back, and the same `totalPages`/`totalRecords` as
   any other page. Export an Express `Router` (or equivalent route-registration function)
   that mounts this at `GET /claims` and returns HTTP 200 with the JSON body.

4. Modify `api/src/server.ts` to import and mount the new router, leaving the existing
   `/health` route untouched.

5. Write `api/src/claims.test.ts` using supertest against the exported `app`, covering
   every row of the Proof table below.

6. **Resolved by human decision at G1: Option 1.** Add one Playwright test to
   `tests/smoke.spec.ts` that requests `GET /api/claims` (and `?page=2`, for page
   coverage) through the real compose stack, matching the acceptance-criteria shape.
   Widen the `--grep` filter already present in `Makefile`'s `verify` target and
   referenced in `.github/workflows/ci.yml`'s comment to also match this new test by
   name, exactly as US-0001's Option B widened it for its own two tests. This grows the
   name-based `--grep` filter with a second story's test name, making the "widen back to
   unfiltered `@smoke`" cleanup already owed to US-0006 (per
   `docs/plan/PLAN-US-0001.md`) larger; the implementer must not let this go unrecorded
   (add to the existing follow-up comments in `Makefile` and `ci.yml` rather than a new
   one). `docs/TESTING.md` is not in this plan's Files that change list and is not
   edited, consistent with US-0001's own precedent for the same situation.

7. Add the new Playwright test to `tests/smoke.spec.ts`, widen the `Makefile` grep, and
   update the `.github/workflows/ci.yml` comment.

8. Run `make lint` and `make test` locally (these exercise `app/` and `api/`; `app/` is
   unaffected by this story and should be unchanged). Run `make verify` locally with the
   widened grep before opening the pull request. If Docker/registry access is unavailable
   in the session, report that rather than working around it (same caveat
   `docs/plan/PLAN-US-0001.md` recorded).

## Proof

| # | Acceptance criterion | Test | Notes |
|---|---|---|---|
| 1 | `GET /api/claims?page=1` returns 200 with `{ claims, page, totalPages, totalRecords }` | `api/src/claims.test.ts` → a test asserting status 200 and the four top-level keys on a request to `/claims?page=1`; plus the new `tests/smoke.spec.ts` Playwright test (step 6/7, Option 1) hitting the literal `/api/claims` through nginx | Both the in-process route and the literal external path are covered. |
| 2 | Each claim object contains at minimum the nine named fields | `api/src/claims.test.ts` → a test asserting every record in a full-page response has all nine keys with truthy/defined values | |
| 3 | `claims` contains at most 10 records for any page | `api/src/claims.test.ts` → a test asserting `claims.length <= 10` for pages 1, 2, and 3 | |
| 4 | Seed dataset has 25 records; `totalPages` is 3, `totalRecords` is 25 | `api/src/claims.test.ts` → a test asserting `totalRecords === 25` and `totalPages === 3` on any page's response | |
| 5 | Pages 2 and 3 return the correct slices (10, then 5), no claim repeated across pages | `api/src/claims.test.ts` → a test collecting `claimId`s from pages 1, 2, and 3, asserting page 2 has 10 records, page 3 has 5, and the union of all three pages' `claimId`s has 25 unique values | |
| 6 | No `page` query parameter behaves as `page=1` | `api/src/claims.test.ts` → a test asserting `GET /claims` (no query string) returns the same `claims` array (by `claimId` sequence) as `GET /claims?page=1` | |
| 7 | `page` greater than `totalPages` returns 200, empty `claims`, correct `page`/`totalPages`/`totalRecords` | `api/src/claims.test.ts` → a test asserting `GET /claims?page=4` (or higher) returns status 200, `claims: []`, `page: 4`, `totalPages: 3`, `totalRecords: 25` | |

All seven acceptance criteria have a named test.

## Risks

- The seed JSON is hand-written static data; a typo producing a duplicate `claimId` or a
  26th/24th record would silently break AC4 or AC5 without necessarily breaking any other
  part of the stack — nothing outside `api/src/claims.test.ts` would catch it.
- `app/nginx.conf`'s generic `/api/` proxy is relied on unmodified. If a future story
  narrows that location block (for example, to an explicit allow-list of paths) without
  re-checking this story's route, `/api/claims` could silently start returning 404 from
  nginx while `api/src/claims.test.ts` continues to pass, since that test never goes
  through nginx.
- Option 1 (chosen at G1) adds a second story's test name to the same temporary `--grep`
  filter US-0001 left as debt for US-0006 to unwind, making that future cleanup slightly
  larger. If not recorded clearly, this could be missed when US-0006 does that cleanup.
- This story's pagination helper is new, shared logic that US-0003 (the UI consuming this
  endpoint) will depend on directly; a change to the response shape after US-0003 is built
  against it would break that story's frontend code even though nothing in `api/` itself
  would fail its own tests.

## Deviations from plan

- Step 8 (run `make lint`/`test`/`verify` locally before opening the PR) could not be
  completed as specified, for an environmental reason this plan already anticipated (see
  its own caveat referencing `docs/plan/PLAN-US-0001.md`). `npm run lint`/`npm run test`/
  `npm run build` were run directly for both `api/` and `app/` and passed; the compiled
  `dist/` output was manually inspected to confirm `tsc`'s `resolveJsonModule` copies
  `claims.seed.json` into `dist/data/`, so `api/Dockerfile` needed no change. `make lint`,
  `make test`, and `make verify` themselves could not run: in this session the Docker
  daemon would not start at all (`ulimit: error setting limit (Operation not permitted)`
  during implementation; confirmed independently by a `verifier` run immediately after,
  which found the daemon simply unreachable). This is a different symptom of the same
  class of sandbox limitation US-0001 hit (there, the daemon started but Docker Hub pulls
  returned 403). Per instruction, this was reported rather than worked around.
  Containerized verification remains outstanding in this session; this PR's own GitHub
  Actions run (on infrastructure with a working Docker daemon and normal registry access,
  same as it was for US-0001's PR) is the actual proof.
