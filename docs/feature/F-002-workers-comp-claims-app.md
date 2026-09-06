---
id: F-002
title: Workers' compensation claims app
issue:
stories: []
---

# Feature: workers' compensation claims app

## Why this feature exists
US-0002 and US-0003 in `F-001` are blocked on a use case. This is that use case: a small
SPA, backed by an API, that manages workers' compensation claims. It gives the agent
pipeline real product functionality to build against, page by page.

## Domain
Workers' compensation: an injured worker files a claim against their employer, the claim
carries an injury description and status, and it moves through a lifecycle (Open, Under
Review, Approved, Denied, Closed) as an adjuster works it.

## Data model (initial)
A single `Claim` resource:
- `id`
- `claimantName`
- `employer`
- `dateOfInjury`
- `injuryType`
- `bodyPart`
- `status` (Open, Under Review, Approved, Denied, Closed)
- `description`
- `adjusterNotes`

Seed data only at this stage, no real persistence layer, consistent with US-0002's scope
in `F-001`.

## Page roadmap

### Page 1 — Claims Dashboard (building now)
A list of claims: claimant, employer, date of injury, status, injury type. Filter/search
by status. Backed by `GET /api/claims`.

### Page 2 — Claim Detail (next)
Single claim view: injured worker info, incident description, injury/body-part, status
history, adjuster notes. Backed by `GET /api/claims/:id` and `PATCH /api/claims/:id` for
status changes.

### Page 3 — New Claim Intake / FNOL (future)
A form to file a First Notice of Loss, creating a new claim. Backed by
`POST /api/claims`.

### Page 4 — Medical / Treatment Tracker (future)
Providers, visit history, and work-restriction status per claim.

### Page 5 — Reports Dashboard (future)
Claims by status and injury type, average days-to-close, cost trends.

## Sequencing
Build and demo one page and its API endpoint at a time, in the order above. Each page
gets its own intent under `docs/intent/` when it is ready to be dispatched, following
`F-001`'s story pattern.

## Out of scope (for now)
Authentication, real persistence/database, file uploads, notifications. These may become
their own future stories once the core claim pages exist.
