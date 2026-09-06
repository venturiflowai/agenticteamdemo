import { useEffect, useRef, useState } from 'react';

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

type SortDirection = 'asc' | 'desc';

interface FetchState {
  loadId: number;
  page: number;
  status: 'success' | 'error';
  data?: ClaimsPageResponse;
}

interface SortState {
  column: keyof Claim;
  direction: SortDirection;
  loadId: number;
}

const COLUMNS: { key: keyof Claim; label: string }[] = [
  { key: 'claimId', label: 'Claim ID' },
  { key: 'claimantName', label: 'Claimant Name' },
  { key: 'employer', label: 'Employer' },
  { key: 'dateOfInjury', label: 'Date of Injury' },
  { key: 'status', label: 'Status' },
];

function sortClaims(claims: Claim[], column: keyof Claim, direction: SortDirection): Claim[] {
  const sorted = [...claims].sort((a, b) => {
    const aValue = a[column];
    const bValue = b[column];
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  });
  return direction === 'asc' ? sorted : sorted.reverse();
}

function ClaimsDashboard() {
  const [page, setPage] = useState(1);
  const [fetchState, setFetchState] = useState<FetchState | null>(null);
  const [sort, setSort] = useState<SortState | null>(null);
  const loadIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    loadIdRef.current += 1;
    const thisLoadId = loadIdRef.current;
    const requestedPage = page;

    fetch(`/api/claims?page=${requestedPage}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        return res.json() as Promise<ClaimsPageResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setFetchState({ loadId: thisLoadId, page: requestedPage, status: 'success', data });
      })
      .catch(() => {
        if (cancelled) return;
        setFetchState({ loadId: thisLoadId, page: requestedPage, status: 'error' });
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const isCurrent = fetchState !== null && fetchState.page === page;
  const loading = !isCurrent;
  const error = isCurrent && fetchState.status === 'error';
  const claims = isCurrent && fetchState.status === 'success' ? fetchState.data!.claims : [];
  const totalPages = isCurrent && fetchState.status === 'success' ? fetchState.data!.totalPages : page;

  const sortApplies = isCurrent && sort !== null && sort.loadId === fetchState.loadId;
  const displayedClaims = sortApplies ? sortClaims(claims, sort!.column, sort!.direction) : claims;

  function handleHeaderClick(column: keyof Claim) {
    if (!isCurrent || fetchState.status !== 'success') {
      return;
    }
    setSort((current) => {
      if (current && current.loadId === fetchState.loadId && current.column === column) {
        return {
          column,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
          loadId: fetchState.loadId,
        };
      }
      return { column, direction: 'asc', loadId: fetchState.loadId };
    });
  }

  return (
    <section>
      {loading && <p role="status">Loading claims…</p>}
      {!loading && error && <p role="alert">Unable to load claims.</p>}
      {!loading && !error && (
        <table>
          <caption>Claims</caption>
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  <button type="button" onClick={() => handleHeaderClick(column.key)}>
                    {column.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedClaims.map((claim) => (
              <tr key={claim.claimId}>
                <td>{claim.claimId}</td>
                <td>{claim.claimantName}</td>
                <td>{claim.employer}</td>
                <td>{claim.dateOfInjury}</td>
                <td>{claim.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div>
        <button
          type="button"
          onClick={() => setPage((current) => current - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((current) => current + 1)}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default ClaimsDashboard;
