# MLS Core

**Give your AI a memory that persists between sessions.**

---

## Get Started

1. Install the plugin in Claude Code
2. Run `/mls-core-start` in any project folder
3. Paste your API key from [memorylayer.pro](https://memorylayer.pro)

That's it. The agent handles the rest.

**No account yet?** Run `/mls-quick-start` to try it locally in 30 seconds.

---

## Commands

| Command | What it does |
|---|---|
| `/mls-core-start` | Start or resume a session |
| `/mls-core-stop` | Save and close a session |
| `/mls-push` | Sync context to the cloud mid-session |
| `/mls-pull` | Load the latest context from the cloud |
| `/mls-upload` | Upload a file to your project |
| `/mls-agents` | Browse and install agent modules |
| `/mls-test` | Check that everything is working |
| `/mls-quick-start` | Try MLS locally — no account needed |

---

## What Gets Saved

Each session writes to a `.mls/` folder in your project:

```
.mls/
  config.json
  context/
    CONTEXT.md      ← project knowledge base
    TASKS.md        ← persistent task list
    CHANGELOG.md    ← session history + handoff notes
    GOALS.md
    FEEDBACK.md
    PREFERENCES.md
    CORRECTIONS.md
```

Add `.mls/` to `.gitignore` — it's per-machine context, not source code.

---

## Other Ways to Connect

**MCP Server** (Cursor, Windsurf, any MCP host):
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

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for REST API and Custom GPT setup.

---

MLS Core is proprietary software by Rabbithole LLC. See [LICENSE](./LICENSE).
