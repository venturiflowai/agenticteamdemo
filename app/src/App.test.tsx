import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App, { APP_NAME } from './App';

describe('App', () => {
  it('renders the application name and the build SHA', () => {
    render(<App />);

    expect(screen.getByRole('heading').textContent).toContain(APP_NAME);
    // import.meta.env.VITE_GIT_SHA is unset in the test environment, so the
    // component's "unknown" fallback is what proves the SHA text renders.
    expect(screen.getByText('unknown').textContent).toBe('unknown');
  });
});
