---
id: US-0003
title: Claims dashboard page
feature: F-001
type: user
depends_on: [US-0002]
issue: 8
status: draft
---

# Intent: claims dashboard page

## Problem
A user wants to be able to see the workers' compensation claim data, but there is no page
to view it. Even once an API exists to serve claims, nobody can see the data without a UI
for it.

## Proposed outcome
A dashboard page shows workers' compensation claims in a table, fetched from the claims
API, ten at a time. The user can move between pages with Previous and Next controls, and
can sort the claims currently on screen by clicking a column header.

## Acceptance criteria
1. The dashboard fetches claims from the API and renders them in a table with these
   columns, in this order: Claim ID, Claimant Name, Employer, Date of Injury, Status.
2. The table shows at most 10 claims at a time, matching the page returned by the API.
3. Previous and Next controls move between pages. Previous is disabled on the first page;
   Next is disabled on the last page.
4. While a page of claims is loading, a loading indicator is shown in place of the table.
5. If the request for a page of claims fails, an error message is shown in place of the
   table.
6. Clicking a column header sorts the rows currently on screen by that column in
   ascending order. All 5 visible columns are sortable.
7. Clicking the same column header again reverses the sort to descending order.
8. Sorting reorders only the rows on screen; it does not fetch data from the API and does
   not affect other pages.
9. A sort does not persist across page navigation: after moving to another page and back,
   the page displays in the API's default order until a header is clicked again.

## Non-functional constraints
- Sorting is client-side, applied only to the 10 (or fewer) rows already on screen. It
  does not require the API to support a sort parameter.
- No authentication required at this stage.

## Out of scope
Clicking a row to navigate to a claim detail page (that page does not exist yet).
Filtering or searching claims. Sorting across all claims rather than the current page
(would require API support). Specific visual design or branding.

## Open questions
None.
