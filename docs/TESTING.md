# Testing, end to end

One spec suite. Four checkpoints. The base URL and the tag filter change; the specs do not.

That single rule is what keeps the checkpoints in sync. The moment you write a separate
"prod smoke suite", it starts drifting from the real suite, and within a month it is
asserting things that no longer exist while missing the things that broke.

## The four checkpoints

| # | Checkpoint | Runs where | Ingress and TLS | Identity | Tags run |
|---|---|---|---|---|---|
| 1 | `make verify` | Docker Compose, any session | No | Mock issuer | `@smoke @e2e` |
| 2 | CI on every pull request | Docker Compose in Actions | No | Mock issuer | `@smoke @e2e` |
| 3 | After deploy to `aks-dev` | Real cluster | Yes | Mock issuer | `@smoke @e2e @data` |
| 4 | After deploy to `aks-prod` | Real cluster | Yes | Real Google | `@smoke` |

Checkpoints 1 and 2 answer "does the change work". Checkpoint 3 answers "does it work when
deployed", which is a different question and catches ingress routing, TLS, DNS, image
pulls, and configuration that Compose never exercises. Checkpoint 4 answers "did the
release land", nothing more.

## The tag taxonomy

Three tags. Keep it to three. A taxonomy nobody can recite is a taxonomy nobody applies.

- **`@smoke`** — Safe to run anywhere, including production. No sign-in, no writes, no
  destructive actions. Health endpoint responds. Homepage renders. An unauthenticated
  request redirects to sign-in. The certificate is valid and not near expiry.
- **`@e2e`** — Full user journeys that require a signed-in user. Depends on the mock
  issuer, so these run everywhere except production.
- **`@data`** — Writes data. Runs only against `aks-dev`, where the dataset resets on
  every deployment anyway.

A spec with no tag does not run in any pipeline. That is deliberate: an untagged spec is
an unfinished decision about where it belongs.

## Why production only gets `@smoke`

Google actively blocks automated sign-in, and production has no mock issuer by design. So
a full login journey cannot run there, and pretending otherwise produces a flaky test that
gets disabled within two weeks and then rots.

What production smoke can honestly assert: the app is up, the page renders, the
certificate is valid, and an unauthenticated request is redirected to Google rather than
being served content. That last one is the important one. It proves the auth gate is in
force without needing to pass through it.

## Base URL

One environment variable, set per checkpoint. Nothing else changes.

```
PLAYWRIGHT_BASE_URL=http://localhost:8080          # checkpoints 1 and 2
PLAYWRIGHT_BASE_URL=https://dev.<your-domain>      # checkpoint 3
PLAYWRIGHT_BASE_URL=https://<your-domain>          # checkpoint 4
```

## Authenticated tests without driving a login form

Do not script the sign-in UI, even against the mock issuer. It is slow, it is the most
brittle part of any suite, and it re-tests the same flow on every spec.

Instead, a Playwright global setup mints a token from the mock issuer once, stores it as
`storageState`, and every `@e2e` spec starts already signed in. One spec, tagged `@e2e`,
does drive the actual sign-in flow, because that flow does need testing once.

This works identically at checkpoints 1, 2, and 3, because the mock issuer is present in
all three. Its absence in production is exactly why `@e2e` does not run there.

## What each checkpoint must do on failure

- Checkpoints 1 and 2: fail the check. Nothing merges.
- Checkpoint 3: fail the workflow before the production gate is ever offered. A failed dev
  e2e run must make the production job unreachable, not merely unapproved.
- Checkpoint 4: fail loudly and trigger the rollback path. A prod smoke failure means the
  release is bad, and the rehearsed response is to roll back, not to investigate while it
  is live.

## Artifacts

Every checkpoint uploads the Playwright HTML report and any trace from a failed test. On a
phone you will not read Actions logs, so the pull request body and the workflow summary
carry the verdict and a link to the report.
