// One config, four checkpoints. Only PLAYWRIGHT_BASE_URL and the tag filter change.
//
// Checkpoint 1 and 2: PLAYWRIGHT_BASE_URL=http://localhost:8080, grep @smoke|@e2e
// Checkpoint 3:       PLAYWRIGHT_BASE_URL=https://dev.<domain>,  grep @smoke|@e2e|@data
// Checkpoint 4:       PLAYWRIGHT_BASE_URL=https://<domain>,      grep @smoke
//
// A spec with no tag runs in no pipeline. That is deliberate.

import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';
const needsAuth = !!process.env.MOCK_ISSUER_URL;

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['github'], ['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: false,
  },
  // Mints a token from the mock issuer once and saves storageState, so @e2e specs start
  // signed in. Skipped when MOCK_ISSUER_URL is absent, which is how production works.
  globalSetup: needsAuth ? require.resolve('./auth.setup.ts') : undefined,
  projects: [
    {
      name: 'unauthenticated',
      grep: /@smoke/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      grep: /@e2e|@data/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: [],
    },
  ],
});
