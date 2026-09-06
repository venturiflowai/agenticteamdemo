import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App, { APP_NAME } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App', () => {
  it('renders the application name and the build SHA', () => {
    // ClaimsDashboard fetches on mount; stub fetch with a promise that never
    // resolves so no real network call is attempted in jsdom (a relative URL
    // like /api/claims has no base to resolve against there) and so it does
    // not race the assertions below.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise(() => {})),
    );

    render(<App />);

    expect(screen.getByRole('heading').textContent).toContain(APP_NAME);
    // import.meta.env.VITE_GIT_SHA is unset in the test environment, so the
    // component's "unknown" fallback is what proves the SHA text renders.
    expect(screen.getByText('unknown').textContent).toBe('unknown');
  });
});
