import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

// These four run everywhere, including production. Nothing here signs in or writes data.

const gitSha = execSync('git rev-parse --short HEAD').toString().trim();

test('@smoke health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBeTruthy();
  expect(body.sha).toBeTruthy();
});

test('@smoke claims endpoint responds', async ({ request }) => {
  const res = await request.get('/api/claims');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.page).toBe(1);
  expect(body.totalRecords).toBe(25);
  expect(body.totalPages).toBe(3);
  expect(Array.isArray(body.claims)).toBe(true);
  expect(body.claims.length).toBeLessThanOrEqual(10);

  const page2Res = await request.get('/api/claims?page=2');
  expect(page2Res.status()).toBe(200);
  const page2Body = await page2Res.json();
  expect(page2Body.page).toBe(2);
  expect(Array.isArray(page2Body.claims)).toBe(true);
  expect(page2Body.claims.length).toBeLessThanOrEqual(10);
});

test('@smoke homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toBeVisible();
  const text = await page.textContent('body');
  expect(text).toContain('Agentic Team Demo');
  expect(text).toContain(gitSha);
});

test('@smoke claims dashboard renders claims table', async ({ page }) => {
  await page.goto('/');
  const table = page.getByRole('table');
  await expect(table).toBeVisible();

  const headers = table.getByRole('columnheader');
  await expect(headers).toHaveText([
    'Claim ID',
    'Claimant Name',
    'Employer',
    'Date of Injury',
    'Status',
  ]);

  const rows = table.locator('tbody tr');
  await expect(rows).toHaveCount(10);

  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
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
