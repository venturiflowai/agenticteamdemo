---
plan_for: US-0003
intent: docs/intent/US-0003-claims-dashboard-page.md
---

# Plan: claims dashboard page

## Files that change

- `app/src/ClaimsDashboard.tsx` — new. The dashboard itself: on mount, and whenever the
  current page number changes, fetches `GET /api/claims?page=<n>` (relative URL, same
  origin, through the existing nginx `/api/` proxy — no new proxy or base-URL config
  needed). While that request is in flight it renders a loading indicator (an element with
  `role="status"`) in place of the table (AC4). If the request throws or resolves with a
  non-2xx status, it renders an error message (`role="alert"`) in place of the table
  instead (AC5). Otherwise it renders a table with columns, in order, Claim ID, Claimant
  Name, Employer, Date of Injury, Status (AC1), one row per claim in the response, capped
  at whatever the API returned (≤10, AC2). Previous/Next controls change the page number;
  Previous is disabled when `page === 1`, Next is disabled when `page === totalPages`
  (AC3). Each of the 5 column headers is clickable and holds local sort state
  (column + direction): first click sorts the rows currently held in state ascending by
  that column, a second click on the same column reverses it to descending, clicking a
  different column starts a fresh ascending sort on the new column (AC6, AC7); sorting
  only reorders the already-fetched rows in memory — it never issues a fetch and never
  touches any other page's data (AC8). Whenever a new page's data is loaded (including
  navigating back to a previously visited page), any active sort is cleared so the page
  renders in the API's default order until a header is clicked again (AC9). No element
  with an ARIA `heading` role (no `<h1>`–`<h6>`, no `role="heading"`) is added anywhere in
  this component — see the note below the file list for why; a `<caption>` (not a
  heading) is used for any table title text.
- `app/src/ClaimsDashboard.test.tsx` — new. Vitest + `@testing-library/react` suite, one
  test per acceptance criterion (see Proof), driving the component with a stubbed
  `global.fetch` returning canned, page-keyed JSON shaped like `api/src/claims.ts`'s real
  `{ claims, page, totalPages, totalRecords }` response. This is the primary, deterministic
  proof for AC1–AC9: it can control fetch timing (to catch the loading state) and force a
  rejection (to catch the error state) in ways a real network call cannot reliably do.
- `app/src/App.tsx` — modify. Renders `<ClaimsDashboard />` beneath the existing header
  (the app name `<h1>` and build-SHA paragraph from US-0001), which is left exactly as it
  is. Nothing existing is removed or renamed.
- `app/src/App.test.tsx` — modify. Stubs `global.fetch` to a promise that never resolves
  before rendering `<App />>`, so `ClaimsDashboard`'s fetch-on-mount does not attempt a
  real network call inside jsdom (a relative URL like `/api/claims` has no base to resolve
  against there) and does not race the two existing assertions. Both existing assertions —
  the heading contains `APP_NAME`, and the text "unknown" renders for the unset
  `VITE_GIT_SHA` — are kept exactly as they are; nothing is deleted or loosened.
- `tests/smoke.spec.ts` — modify (existing, shared file, not owned solely by this story,
  same as it was for US-0002). Adds one new Playwright test that loads `/` against the
  real running compose stack and asserts the dashboard actually renders real seeded data:
  the five column headers appear in order, exactly 10 rows render for the real first page
  (25 seed records per `docs/plan/PLAN-US-0002.md`), and Previous is disabled while Next is
  enabled. This is the one thing the mocked-`fetch` Vitest suite cannot prove — that the
  real `fetch('/api/claims')` call actually reaches the real API through the real nginx
  proxy and renders real data — mirroring exactly how `docs/plan/PLAN-US-0002.md` reserved
  Playwright for the one literal external-contract check and used
  Vitest+supertest for everything else. The other three existing tests in this file are
  not touched.
- `Makefile` — modify. Widens the `--grep` filter already present in the `verify` target
  (currently `"health endpoint responds|homepage renders|claims endpoint responds"`) to
  also match this story's new test by name, following the exact precedent set by
  US-0001 (Option B) and continued by US-0002 (Option 1). Extends the existing FOLLOW-UP
  comment above it (does not add a second, separate comment) to note that this story
  appended a third test name to the same temporary filter still owed to US-0006.
- `.github/workflows/ci.yml` — modify. Updates the comment above the `make verify` step to
  mention the further-widened grep, matching the existing comment's wording.

No other files are planned. In particular: no new npm dependency is added (an already
mocked `global.fetch` and the already-installed `@testing-library/react` are sufficient;
`@testing-library/jest-dom` is not installed today and this plan does not add it — assertions
use `.textContent`, `queryBy*`/`getBy*` presence, and the DOM `disabled` property, matching
`App.test.tsx`'s existing style); `app/Dockerfile`, `app/nginx.conf`, `docker-compose.yml`,
and `api/` are all unmodified, since they already support everything this story needs.

**Why no ARIA heading is added in `ClaimsDashboard.tsx`:** the existing, pre-existing
`tests/smoke.spec.ts` test `@smoke homepage renders` (owned by US-0001, not edited by this
plan) asserts `page.getByRole('heading')` resolves to visible — a strict-mode Playwright
locator that throws if it matches more than one element. `App.tsx`'s existing `<h1>` is
already that one heading. Adding a second heading-role element anywhere on the page (for
example, an `<h2>Claims</h2>` section title) would break that unrelated, out-of-scope test.
Per `CLAUDE.md`, the fix for a broken test is always in the code under test, never the
test, so this plan avoids the conflict at the design level instead: no new heading-role
element, a `<caption>` if a title is wanted.

**Why Playwright is not used to prove every acceptance criterion:** the loading/error/
pagination/sorting behaviors (AC3–AC9) are all provable deterministically at the
component level by controlling a stubbed `fetch`'s timing, response, and page-keyed
payloads — the same class of choice US-0001 and US-0002 already made at G1 (Vitest for
behavior, one Playwright test for the literal end-to-end contract). This plan follows that
precedent rather than treating it as a fresh, genuine fork. A reviewer who prefers full
browser-driven coverage of every criterion instead of this split can say so at G1, exactly
as happened for US-0001's and US-0002's own forks; this plan proceeds on the precedent
already established rather than re-litigating it, and does not present a second
Order of work.

## Order of work

1. Confirm the starting state matches this plan's assumptions: `app/src/App.tsx` renders
   only the app-name/build-SHA header; no `ClaimsDashboard` component exists yet;
   `api/src/claims.ts` already exposes `GET /claims` returning
   `{ claims, page, totalPages, totalRecords }` with 25 seeded records across 3 pages
   (US-0002, merged); `tests/smoke.spec.ts` contains exactly the four existing tests (the
   two API tests, the homepage-renders test, and the two auth/TLS tests not yet
   executed); the `Makefile`'s `verify` target's `--grep` is exactly
   `"health endpoint responds|homepage renders|claims endpoint responds"`.

2. Write `app/src/ClaimsDashboard.tsx` per the description in Files that change: fetch on
   mount and on page change; loading indicator (`role="status"`) in place of the table
   while the current page's request is pending; error message (`role="alert"`) in place of
   the table if that request fails; otherwise a table with the five columns in the
   required order, capped at the API's page size; Previous/Next controls with the
   required disabled states; five clickable column headers with ascending/toggle-to-
   descending local sort that never fetches and never mutates another page's data; sort
   state cleared whenever a new page's data loads. No ARIA heading-role element anywhere
   in this component.

3. Write `app/src/ClaimsDashboard.test.tsx`: stub `global.fetch` per test with `vi.fn()`
   returning canned, page-keyed responses shaped like the real API. Write one named test
   per row of the Proof table below; do not fold multiple acceptance criteria into one
   undifferentiated test.

4. Modify `app/src/App.tsx` to render `<ClaimsDashboard />` beneath the untouched existing
   header.

5. Modify `app/src/App.test.tsx` to stub `global.fetch` (a promise that never resolves)
   before rendering `<App />`, so the newly-added `ClaimsDashboard`'s fetch-on-mount does
   not attempt a real network call in jsdom or race the two existing assertions. Check
   `app/vite.config.ts`'s Vitest `test` block for `restoreMocks`/`unstubGlobals`; if
   neither is configured, call `vi.unstubAllGlobals()` in an `afterEach` so the stub does
   not leak into other test files. Keep both existing assertions unchanged.

6. Add one new test to `tests/smoke.spec.ts`, in the same style as the file's existing
   tests (`page` fixture, real compose stack): navigate to `/`, wait for the table to
   render, and assert the five column headers appear in order, exactly 10 data rows render
   on the real first page, Previous is disabled, and Next is enabled. Give it a title
   starting with `@smoke` and containing a distinctive phrase not already in the
   Makefile's filter, e.g. `@smoke claims dashboard renders claims table`. Do not modify
   the file's other three tests.

7. Modify `Makefile`: append the new test's distinctive phrase to the existing `--grep`
   argument (e.g. `"health endpoint responds|homepage renders|claims endpoint responds|claims dashboard renders claims table"`).
   Extend the existing FOLLOW-UP comment above it, in place, to note this story added a
   third test name to the filter still owed to US-0006's cleanup.

8. Modify `.github/workflows/ci.yml`'s comment above the `make verify` step to mention the
   further-widened grep, matching the existing wording style.

9. Run `make lint`, `make test`, and `make verify` locally before opening the pull request.
   If the containerized `make` targets cannot run for an environmental reason (no Docker
   daemon, no registry egress — the same class of limitation `docs/plan/PLAN-US-0001.md`
   and `docs/plan/PLAN-US-0002.md` both hit), run `npm run lint` / `npm run test` directly
   inside `app/` (and confirm `api/` is unaffected) and report the limitation rather than
   silently skip verification; a passing CI run of `make verify` remains the actual proof
   before merge.

## Proof

| # | Acceptance criterion | Test |
|---|---|---|
| 1 | Fetches claims and renders a table with columns Claim ID, Claimant Name, Employer, Date of Injury, Status, in that order | `app/src/ClaimsDashboard.test.tsx` → a test asserting the rendered column headers, in order, from a mocked response; corroborated end-to-end by `tests/smoke.spec.ts` → `@smoke claims dashboard renders claims table` against the real API |
| 2 | The table shows at most 10 claims at a time, matching the page returned by the API | `app/src/ClaimsDashboard.test.tsx` → a test asserting the rendered row count equals the mocked response's `claims.length` for both a full page (10) and a partial last page (5); corroborated by the Playwright test's row-count assertion against the real 25-record seed |
| 3 | Previous/Next move between pages; Previous disabled on the first page; Next disabled on the last page | `app/src/ClaimsDashboard.test.tsx` → a test moving from a mocked page 1 to a mocked page 2 and back, asserting Previous is disabled only on page 1 and enabled otherwise, and Next is disabled only when the mocked response's `page === totalPages` |
| 4 | A loading indicator is shown in place of the table while a page is loading | `app/src/ClaimsDashboard.test.tsx` → a test using an unresolved/deferred mocked fetch promise, asserting the loading indicator is present and the table is absent before the promise resolves |
| 5 | An error message is shown in place of the table if the request fails | `app/src/ClaimsDashboard.test.tsx` → a test with a mocked fetch that rejects (or resolves non-2xx), asserting the error message is present and the table is absent |
| 6 | Clicking a column header sorts on-screen rows ascending by that column; all 5 columns are sortable | `app/src/ClaimsDashboard.test.tsx` → a test clicking each of the 5 column headers in turn against a mocked, deliberately-unsorted page and asserting ascending order by that column each time |
| 7 | Clicking the same header again reverses to descending | `app/src/ClaimsDashboard.test.tsx` → a test clicking one header twice and asserting the second click's row order is the reverse of the first |
| 8 | Sorting reorders only on-screen rows; it does not fetch and does not affect other pages | `app/src/ClaimsDashboard.test.tsx` → a test asserting the mocked `fetch` call count is unchanged after clicking column headers, and that navigating to a different mocked page afterward still renders that page's own default (unsorted) order |
| 9 | A sort does not persist across page navigation | `app/src/ClaimsDashboard.test.tsx` → a test that sorts the current page, navigates to another mocked page and back, and asserts the original page's rows are back in the API's default order, not the previously chosen sort |

All 9 acceptance criteria have a named test. No criterion is flagged as untestable.

## Risks

- The central risk is the one already worked around at the design level: any new
  ARIA-heading-role element added anywhere in `ClaimsDashboard.tsx` would break the
  unrelated, pre-existing, not-owned `tests/smoke.spec.ts` test `@smoke homepage renders`
  (a strict-mode Playwright locator on `getByRole('heading')`). This plan avoids the
  conflict by construction (no heading-role element, a `<caption>` if needed), but an
  implementer who deviates from that constraint would silently break a test outside the
  files this plan lists as changing.
- `app/src/ClaimsDashboard.test.tsx` validates behavior against a self-authored mock of the
  claims API's response shape. If `api/src/claims.ts`'s real contract drifts (field names,
  `totalPages`/`totalRecords` semantics) after this story ships, the mocked Vitest suite
  would keep passing while the real integration silently breaks; only the new Playwright
  test in `tests/smoke.spec.ts` (page-1 happy path only) would catch that, and only if run.
- `tests/smoke.spec.ts` is shared across every story. This plan appends a third test name
  to the temporary `--grep` filter already flagged as debt for US-0006 to unwind
  (`docs/plan/PLAN-US-0001.md`, widened by `docs/plan/PLAN-US-0002.md`). If the FOLLOW-UP
  comment update in step 7 is skipped, this growing filter goes unrecorded.
- `main.tsx` already wraps `<App />` in React `StrictMode`, which double-invokes effects in
  development. `ClaimsDashboard`'s fetch-on-mount/fetch-on-page-change effect must not
  double-fire a real request or race itself when invoked twice; this is a correctness risk
  inherited from an existing file this plan does not modify, not something introduced by
  the files in this plan, but it can only be validated inside `ClaimsDashboard.tsx` itself.
- Docker daemon or registry access may be unavailable in whatever session runs
  `make build`/`lint`/`test`/`verify`, the same environmental risk already recorded in
  `docs/plan/PLAN-US-0001.md` and `docs/plan/PLAN-US-0002.md`.
- `app/nginx.conf`'s `/api/` proxy and `api/src/claims.ts`'s response contract are both
  relied on unmodified by this plan. A concurrent, unrelated change narrowing the proxy or
  renaming a response field would not be caught by the mocked Vitest suite — only by the
  new Playwright test in step 6, and only if that test is actually run (i.e., the
  `--grep` widening in step 7 is not dropped or mistyped).

## Deviations from plan

