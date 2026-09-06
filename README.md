# Bootstrap kit

Drop these files into a new repository to start the agent-driven delivery loop.

| Path | What it is |
|---|---|
| `docs/BOOTSTRAP.md` | The ten-minute manual setup, then the session-by-session path to your first merged story |
| `docs/intent/_TEMPLATE.md` | The intent structure. Every story file follows it exactly |
| `docs/intent/US-0001-*.md` | The scaffold story, written and ready to dispatch |
| `docs/feature/F-001-*.md` | The parent feature and its four stories |
| `.claude/skills/intent-capture/SKILL.md` | How Claude interviews you and writes an intent |
| `.claude/agents/` | The five-agent team: planner, implementer, verifier, plan-compliance, security-review |
| `.claude/commands/` | `/plan` and `/implement`, the two dispatch commands |
| `.claude/hooks/protect-intents.sh` | Blocks any agent edit to a committed intent |
| `.claude/settings.json` | Permission allow and deny lists, and the hook wiring |
| `docs/AGENT-TEAM.md` | Who the agents are, why five, and where the gates sit |
| `docs/TESTING.md` | The four test checkpoints, the tag taxonomy, and what runs where |
| `tests/` | Playwright config, tag conventions, and the production-safe smoke specs |
| `scripts/check-intents.sh` | Validates intent front matter and structure before syncing |
| `scripts/sync-issues.sh` | Turns committed intents into GitHub issues, idempotently |
| `.github/workflows/sync-issues.yml` | Runs the sync on merge to main |

Start with `docs/BOOTSTRAP.md`. If you already have a repository underway, read
`docs/ADOPT-INTO-EXISTING-REPO.md` instead.
