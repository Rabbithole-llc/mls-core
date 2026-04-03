# MLS Core — Memory Layer System

**Persistent memory for AI agents, scoped to a single folder.**

MLS Core gives AI agents persistent memory across sessions. Without it, every session starts cold. With Core, each session starts warm: the agent knows the project context, what was worked on, what's next, and what the last agent left behind.

## What It Does

Every folder with MLS Core installed becomes a "brain" that any AI agent can read, write to, and build on across sessions. Core manages three foundational files:

- **CONTEXT.md** — The project knowledge base. What this is, who's involved, key decisions, domain knowledge.
- **TASKS.md** — Living to-do list that persists across sessions.
- **CHANGELOG.md** — Session history with "For Next Agent" handoff notes — the backbone of session continuity.

## How It Works

1. **Session Start** — Agent reads context files, loads the last handoff note, and displays project status. Full context in under a minute.
2. **Work** — Agent builds on existing context. New knowledge gets added to CONTEXT.md, tasks get tracked in TASKS.md.
3. **Session Close** — Agent writes a handoff note for the next session, updates metrics, and optionally syncs to Notion.

## License Tiers

| Feature | Starter | Pro | Enterprise |
|---|---|---|---|
| Core memory system | Yes | Yes | Yes |
| Max users per folder | 2 | Unlimited | Unlimited |
| Notion sync | - | Yes | Yes |
| Hub (multi-folder) | - | Yes | Yes |
| Custom modules | - | Yes | Yes |
| Centralized management | - | - | Yes |

## Installation

MLS Core is distributed as a Claude Code skill. Install the `mls-core-start` and `mls-core-stop` skills into your `.claude/skills/` directory.

## Legal

MLS Core is proprietary software created by Rabbithole LLC.
Redistribution, resale, or creation of derivative products is prohibited without written permission.

See [LICENSE](./LICENSE) for full terms.
