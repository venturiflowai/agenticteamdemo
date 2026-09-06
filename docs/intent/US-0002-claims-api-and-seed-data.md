---
id: US-0002
title: Workers' compensation claims API and seed data
feature: F-001
type: user
depends_on: [US-0001]
issue:
status: draft
---

# Intent: workers' compensation claims API and seed data

## Problem
There is no way to retrieve workers' compensation claim data. The web application needs
to show all claims stored in the data store (a JSON document, not a real database at this
stage), but no API exists to serve that data, and no sample claim data exists for it to
serve.

## Proposed outcome
A read-only API endpoint serves workers' compensation claim records from a seed JSON
dataset. Each claim includes a claim id and claimant name, and other identifying detail
(employer, date of injury, injury type, body part, status, description, adjuster notes).
Records are paginated at 10 per page via a query parameter, and the response tells the
caller the current page and how many pages exist in total, so a UI can build pagination
controls. The seed dataset contains enough sample claims to demonstrate three pages.

## Acceptance criteria
1. `GET /api/claims?page=1` returns HTTP 200 with a JSON body of the shape
   `{ claims: [...], page, totalPages, totalRecords }`.
2. Each object in `claims` contains at minimum: `claimId`, `claimantName`, `employer`,
   `dateOfInjury`, `injuryType`, `bodyPart`, `status`, `description`, `adjusterNotes`.
3. `claims` contains at most 10 records for any page.
4. The seed dataset contains 25 claim records, so `totalPages` is 3 and `totalRecords`
   is 25.
5. `GET /api/claims?page=2` and `GET /api/claims?page=3` each return the correct
   subsequent slice of records (10, then 5), with no claim repeated across pages.
6. `GET /api/claims` with no `page` query parameter behaves as `page=1`.
7. `GET /api/claims` with a `page` number greater than `totalPages` returns HTTP 200 with
   an empty `claims` array, and correct `page`, `totalPages`, and `totalRecords` values.

## Non-functional constraints
- Read-only endpoint. No create, update, or delete in this story.
- Claim data is served from a static seed JSON file loaded into memory, not a database.
- No authentication required at this stage.

## Out of scope
Filtering or searching claims by status or any other field. Any endpoint other than
`GET /api/claims`. Persistence beyond the static seed file. The web UI that consumes this
API (that is US-0003).

## Open questions
None.
