# Bootstrap kit

Drop these files into a new repository to start the agent-driven delivery loop.

| Path | What it is |
|---|---|
| `docs/BOOTSTRAP.md` | The ten-minute manual setup, then the session-by-session path to your first merged story |
| `docs/intent/_TEMPLATE.md` | The intent structure. Every story file follows it exactly |
| `docs/intent/US-0001-*.md` | The scaffold story, written and ready to dispatch |
| `docs/feature/F-001-*.md` | The parent feature and its four stories |
| `.claude/skills/intent-capture/SKILL.md` | How Claude interviews you and writes an intent |
| `scripts/sync-issues.sh` | Turns committed intents into GitHub issues, idempotently |
| `.github/workflows/sync-issues.yml` | Runs the sync on merge to main |

Start with `docs/BOOTSTRAP.md`.
