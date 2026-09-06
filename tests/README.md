# Tests

One suite. See `docs/TESTING.md` for which tags run at which checkpoint and why.

## Tags

Put exactly one on every spec title.

- `@smoke` — safe anywhere including production. No sign-in, no writes.
- `@e2e` — needs a signed-in user. Requires the mock issuer, so never runs in production.
- `@data` — writes data. Dev namespace only.

An untagged spec runs nowhere. That is not a bug, it is an unfinished decision about where
the spec belongs.

## Running

```bash
make verify                                   # checkpoint 1, compose plus smoke and e2e
npx playwright test --grep "@smoke"           # what production runs
PLAYWRIGHT_BASE_URL=https://dev.example.com \
  npx playwright test --grep "@smoke|@e2e|@data"
```

## Signing in

Do not script the sign-in form. `auth.setup.ts` mints a token from the mock issuer once
and saves it as `storageState`, so every `@e2e` spec starts already authenticated.

Exactly one spec drives the real sign-in flow, because that flow does need testing once.
Every other spec skips it, which keeps the suite fast and removes the most brittle
interaction from every test that does not care about it.
