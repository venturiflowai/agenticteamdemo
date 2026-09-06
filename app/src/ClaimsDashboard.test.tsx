import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ClaimsDashboard from './ClaimsDashboard';

interface Claim {
  claimId: string;
  claimantName: string;
  employer: string;
  dateOfInjury: string;
  status: string;
}

interface ClaimsPageResponse {
  claims: Claim[];
  page: number;
  totalPages: number;
  totalRecords: number;
}

const COLUMN_LABELS = ['Claim ID', 'Claimant Name', 'Employer', 'Date of Injury', 'Status'];

function claim(
  claimId: string,
  claimantName: string,
  employer: string,
  dateOfInjury: string,
  status: string,
): Claim {
  return { claimId, claimantName, employer, dateOfInjury, status };
}

function jsonResponse(body: ClaimsPageResponse, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Promise<Response>;
}

// Deliberately unsorted across every column so ascending-sort assertions are
// meaningful for whichever column is clicked.
const PAGE_1_CLAIMS: Claim[] = [
  claim('C005', 'Wendy Delgado', 'Roswell Freight', '2026-02-11', 'Open'),
  claim('C002', 'Amir Castillo', 'Bright Foundry', '2026-01-03', 'Closed'),
  claim('C009', 'Kai Nakamura', 'Zenith Retail', '2026-03-20', 'Pending'),
  claim('C001', 'Priya Shah', 'Anchor Logistics', '2025-12-15', 'Denied'),
  claim('C007', 'Marco Reyes', 'Northgate Mfg', '2026-02-28', 'Open'),
  claim('C003', 'Ines Fontaine', 'Bright Foundry', '2026-01-19', 'Pending'),
  claim('C010', 'Tobias Lang', 'Zenith Retail', '2026-04-02', 'Closed'),
  claim('C004', 'Grace Odom', 'Northgate Mfg', '2026-01-27', 'Open'),
  claim('C008', 'Sam Whittaker', 'Roswell Freight', '2026-03-05', 'Denied'),
  claim('C006', 'Layla Haddad', 'Anchor Logistics', '2026-02-14', 'Pending'),
];

const PAGE_2_CLAIMS: Claim[] = [
  claim('C011', 'Noor Al-Sayed', 'Anchor Logistics', '2026-04-10', 'Open'),
  claim('C012', 'Derek Munoz', 'Bright Foundry', '2026-04-11', 'Closed'),
  claim('C013', 'Felicity Chen', 'Zenith Retail', '2026-04-12', 'Pending'),
  claim('C014', 'Oliver Kaine', 'Northgate Mfg', '2026-04-13', 'Denied'),
  claim('C015', 'Ramona Sol', 'Roswell Freight', '2026-04-14', 'Open'),
];

function page1(overrides: Partial<ClaimsPageResponse> = {}): ClaimsPageResponse {
  return { claims: PAGE_1_CLAIMS, page: 1, totalPages: 2, totalRecords: 15, ...overrides };
}

function page2(overrides: Partial<ClaimsPageResponse> = {}): ClaimsPageResponse {
  return { claims: PAGE_2_CLAIMS, page: 2, totalPages: 2, totalRecords: 15, ...overrides };
}

function getDataRows() {
  const table = screen.getByRole('table');
  const rows = within(table).getAllByRole('row');
  // First row is the header row.
  return rows.slice(1);
}

function getColumnValues(columnIndex: number) {
  return getDataRows().map((row) => {
    const cells = within(row).getAllByRole('cell');
    return cells[columnIndex].textContent ?? '';
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ClaimsDashboard', () => {
  it('AC1: renders a table with the five columns in order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(page1())),
    );

    render(<ClaimsDashboard />);

    await screen.findByRole('table');
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers).toEqual(COLUMN_LABELS);
  });

  it('AC2: renders at most 10 rows, matching a full page and a partial last page', async () => {
    const fullPageFetch = vi.fn().mockImplementation(() => jsonResponse(page1()));
    vi.stubGlobal('fetch', fullPageFetch);
    const { unmount } = render(<ClaimsDashboard />);
    await screen.findByRole('table');
    expect(getDataRows()).toHaveLength(10);
    unmount();
    cleanup();

    const partialPageFetch = vi
      .fn()
      .mockImplementation(() => jsonResponse(page2({ claims: PAGE_2_CLAIMS })));
    vi.stubGlobal('fetch', partialPageFetch);
    render(<ClaimsDashboard />);
    await screen.findByRole('table');
    expect(getDataRows()).toHaveLength(5);
  });

  it('AC3: Previous/Next navigate pages with the correct disabled states', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      const url = new URL(input, 'http://localhost');
      const requestedPage = url.searchParams.get('page') ?? '1';
      return jsonResponse(requestedPage === '2' ? page2() : page1());
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ClaimsDashboard />);
    await screen.findByRole('table');

    const previousButton = () =>
      screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement;
    const nextButton = () => screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement;

    expect(previousButton().disabled).toBe(true);
    expect(nextButton().disabled).toBe(false);

    nextButton().click();
    await waitFor(() => expect(getDataRows()).toHaveLength(5));

    expect(previousButton().disabled).toBe(false);
    expect(nextButton().disabled).toBe(true);

    previousButton().click();
    await waitFor(() => expect(getDataRows()).toHaveLength(10));

    expect(previousButton().disabled).toBe(true);
    expect(nextButton().disabled).toBe(false);
  });

  it('AC4: shows a loading indicator and no table while a page is loading', async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => pending),
    );

    render(<ClaimsDashboard />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();

    resolveFetch({
      ok: true,
      status: 200,
      json: () => Promise.resolve(page1()),
    });

    await screen.findByRole('table');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('AC5: shows an error message and no table if the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.reject(new Error('network error'))),
    );

    render(<ClaimsDashboard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('AC5b: shows an error message and no table on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(page1(), false, 500)),
    );

    render(<ClaimsDashboard />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('AC6: clicking each column header sorts the on-screen rows ascending by that column', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(page1())),
    );

    render(<ClaimsDashboard />);
    await screen.findByRole('table');

    for (let columnIndex = 0; columnIndex < COLUMN_LABELS.length; columnIndex += 1) {
      const header = screen.getAllByRole('columnheader')[columnIndex];
      within(header).getByRole('button').click();

      await waitFor(() => {
        const values = getColumnValues(columnIndex);
        const expected = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
        expect(values).toEqual(expected);
      });
    }
  });

  it('AC7: clicking the same header again reverses to descending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(page1())),
    );

    render(<ClaimsDashboard />);
    await screen.findByRole('table');

    const header = screen.getAllByRole('columnheader')[0];
    within(header).getByRole('button').click();
    let ascending: string[] = [];
    await waitFor(() => {
      ascending = getColumnValues(0);
      const expected = [...ascending].sort();
      expect(ascending).toEqual(expected);
    });

    within(header).getByRole('button').click();
    await waitFor(() => {
      const descending = getColumnValues(0);
      expect(descending).toEqual([...ascending].reverse());
    });
  });

  it('AC8: sorting does not fetch again and does not affect other pages', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      const url = new URL(input, 'http://localhost');
      const requestedPage = url.searchParams.get('page') ?? '1';
      return jsonResponse(requestedPage === '2' ? page2() : page1());
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ClaimsDashboard />);
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const claimIdHeader = screen.getAllByRole('columnheader')[0];
    within(claimIdHeader).getByRole('button').click();
    await waitFor(() => {
      expect(getColumnValues(0)).toEqual([...getColumnValues(0)].sort());
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    screen.getByRole('button', { name: 'Next' }).click();
    await waitFor(() => expect(getDataRows()).toHaveLength(5));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getColumnValues(0)).toEqual(PAGE_2_CLAIMS.map((c) => c.claimId));
  });

  it('AC9: a sort does not persist across page navigation', async () => {
    const fetchMock = vi.fn().mockImplementation((input: string) => {
      const url = new URL(input, 'http://localhost');
      const requestedPage = url.searchParams.get('page') ?? '1';
      return jsonResponse(requestedPage === '2' ? page2() : page1());
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ClaimsDashboard />);
    await screen.findByRole('table');
    const defaultOrder = getColumnValues(0);

    const claimIdHeader = screen.getAllByRole('columnheader')[0];
    within(claimIdHeader).getByRole('button').click();
    await waitFor(() => {
      expect(getColumnValues(0)).toEqual([...defaultOrder].sort());
    });

    screen.getByRole('button', { name: 'Next' }).click();
    await waitFor(() => expect(getDataRows()).toHaveLength(5));

    screen.getByRole('button', { name: 'Previous' }).click();
    await waitFor(() => expect(getDataRows()).toHaveLength(10));

    expect(getColumnValues(0)).toEqual(defaultOrder);
  });
});
