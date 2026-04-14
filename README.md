# MLS Core

**AI agents that remember everything, automatically.**

Every session picks up where the last one left off — context, tasks, goals, and a handoff note from the previous agent. No more re-explaining. No more cold starts.

---

## Get Started in 3 Steps

1. Install the plugin in Claude Code
2. Run `/mls-core-start` in any project folder
3. Paste your API key from [memorylayer.pro](https://memorylayer.pro) — or press Enter to run locally

That's it. The agent handles the rest.

---

## Commands

| Command | What it does |
|---|---|
| `/mls-core-start` | Start a session |
| `/mls-core-stop` | Save and close a session |
| `/mls-push` | Save context to the cloud mid-session |
| `/mls-pull` | Load the latest context from the cloud |
| `/mls-upload` | Upload a file to your project |
| `/mls-agents` | Browse and install agent modules |
| `/mls-test` | Check that everything is working |

---

## What Gets Saved

Each session writes to a `.mls/` folder in your project:

- **CONTEXT.md** — project knowledge base
- **TASKS.md** — persistent task list
- **CHANGELOG.md** — session history with handoff notes
- **GOALS.md**, **FEEDBACK.md**, **PREFERENCES.md**, **CORRECTIONS.md**

Add `.mls/` to your `.gitignore`.

---

## Other Connection Methods

MLS Core supports three connection approaches — all use the same backend.

### MCP Server (Cursor, Windsurf, any MCP host)

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": { "MLS_API_KEY": "ml_your_key_here" }
    }
  }
}
```

Add to `.claude/settings.json` (Claude Code), `.cursor/mcp.json` (Cursor), or `~/.codeium/windsurf/mcp_config.json` (Windsurf).

### REST API (any HTTP client, GPT Actions)

**Base URL:** `https://pjtqhxurdbaeatssorju.supabase.co/functions/v1`

Key endpoints: `/register`, `/session-start`, `/session-end`, `/remember`, `/recall`, `/file-upload`, `/file-ops`

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full setup instructions, curl examples, and Custom GPT connection guide.

---

## License Tiers

| Feature | Starter | Pro | Enterprise |
|---|---|---|---|
| Core memory (context, tasks, goals) | Yes | Yes | Yes |
| Cloud sync | Yes | Yes | Yes |
| File storage | - | Yes | Yes |
| Semantic search | - | Yes | Yes |
| Team sharing (hub) | - | Yes | Yes |
| MCP server | Yes | Yes | Yes |
| Agent marketplace | - | Yes | Yes |

---

MLS Core is proprietary software by Rabbithole LLC. See [LICENSE](./LICENSE) for terms.
