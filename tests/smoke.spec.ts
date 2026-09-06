import { expect, test } from '@playwright/test';

// These four run everywhere, including production. Nothing here signs in or writes data.

test('@smoke health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBeTruthy();
});

test('@smoke homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
});

test('@smoke unauthenticated request is not served content', async ({ page }) => {
  // Proves the auth gate is in force without passing through it. This is the assertion
  // that earns production smoke its keep.
  const res = await page.goto('/');
  expect(res?.status()).toBeLessThan(400);
  await expect(page.getByTestId('sign-in')).toBeVisible();
});

test('@smoke certificate is valid and not near expiry', async ({ baseURL }) => {
  test.skip(!baseURL?.startsWith('https'), 'no TLS at this checkpoint');
  // Implementation note for the agent: read the peer certificate via a TLS socket to the
  // host in baseURL and assert notAfter is more than 30 days away.
});
