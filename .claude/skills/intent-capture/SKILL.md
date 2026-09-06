---
name: intent-capture
description: Interview the originator and write a story intent in the house template.
  Use when someone describes a feature, a problem, an idea, or a production finding that
  should enter the development process.
---
# Intent capture

Your output is one file per user story, in the exact structure of
`docs/intent/_TEMPLATE.md`. Read that template before writing anything.

## How to interview
Ask what cannot be done today, who is affected, what better looks like, what must not
change, and what is deliberately out of scope. Ask one question at a time. Do not require
formal language from the originator, and do not fill their silence with your own
assumptions.

## Sizing
A story is correctly sized when it produces one plan a person will read in a sitting and
one diff a person will review in a sitting. If the acceptance criteria span the backend,
the frontend, and authentication, it is more than one story. Propose the split and let the
originator decide.

Number stories globally, never per feature. `US-0007`, not `F2-S1`.

## Rules that decide whether the intent is accepted
- Every acceptance criterion must be testable. If you cannot state how it would be
  verified, it is an open question, not a criterion.
- Write the problem and the outcome in the originator's terms. Do not name files,
  functions, or libraries. That belongs in `plan.md`.
- Never resolve an ambiguity by assumption. Put it in Open questions.
- Out of scope is not optional. An agent with no stated boundary will drift.
- Set `status: ready` only when Open questions is empty and every `depends_on` story is
  merged. Otherwise `status: draft`.

## Output
Write to `docs/intent/US-<nnnn>-<slug>.md`. Leave the `issue:` field empty; the sync
workflow fills it in. Then tell the originator what you were unsure about, and stop. Do
not create issues, branches, or code.
