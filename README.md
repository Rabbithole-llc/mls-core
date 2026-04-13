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
3. **Session Close** — Agent writes a handoff note for the next session, updates metrics, and syncs to Supabase.

---

## Installation

MLS Core supports two integration paths. Both connect to the same memorylayer.pro backend.

### Approach A: Plugin (Claude Code only)

Install the Claude Code plugin. Claude reads the SKILL.md files and executes all MLS operations itself via HTTP calls to the Supabase backend.

**Best for:** Claude Code users who want zero-config setup.

**Steps:**
1. Open Claude Code
2. Run `/install` or paste the plugin URL from [memorylayer.pro](https://memorylayer.pro)
3. Run `/mls-core-start` in any project folder

**Available slash commands:**
| Command | Description |
|---|---|
| `/mls-core-start` | Start a session — first-run setup or returning bootstrap |
| `/mls-core-stop` | Close a session — write handoff, sync to cloud |
| `/mls-push` | Push local context to Supabase |
| `/mls-pull` | Pull remote context into local files |
| `/mls-agents` | Browse and install agents from the marketplace |
| `/mls-test` | Health check — validate structure and connections |

---

### Approach B: MCP Server (Claude Code, Cursor, Windsurf, and any MCP host)

Connect the MLS Core MCP server. The server exposes all MLS operations as typed tool calls — no HTTP wrangling, proper error surfaces, and works in any MCP-compatible AI tool.

**Best for:** Cursor, Windsurf, or Claude Code users who want more reliable tool execution and platform-agnostic setup.

**MCP Server tools (15 total):**
| Tool | Description |
|---|---|
| `mls_session_start` | Bootstrap a session — first-run or returning |
| `mls_session_end` | Close session, write handoff, sync |
| `mls_push` | Push context to Supabase |
| `mls_pull` | Pull context from Supabase |
| `mls_upload_file` | Upload a file to the Files page |
| `mls_download_file` | Download a stored file |
| `mls_list_files` | List uploaded files |
| `mls_search` | Semantic search across project memory |
| `mls_agents_list` | Browse the agent marketplace |
| `mls_agent_install` | Install an agent |
| `mls_agent_remove` | Remove an agent |
| `mls_agent_run` | Log an agent run |
| `mls_invite` | Invite a team member |
| `mls_team` | List team members and roles |
| `mls_health` | Check connection and sync health |

#### MCP Server Setup

<a name="mcp-server-setup"></a>

**Option 1 — Claude Code**

Add to your `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "your-api-key-from-config.json"
      }
    }
  }
}
```

**Option 2 — Cursor**

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global):

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "your-api-key-from-config.json"
      }
    }
  }
}
```

**Option 3 — Windsurf**

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "your-api-key-from-config.json"
      }
    }
  }
}
```

**Where is `MLS_API_KEY`?**

Your API key is in `.mls/config.json` in any project where you've run `/mls-core-start`:
```json
{
  "supabase": {
    "api_key": "YOUR_KEY_HERE"
  }
}
```

Or find it at [memorylayer.pro/dashboard → Settings → API Keys](https://memorylayer.pro/dashboard).

---

## License Tiers

| Feature | Starter | Pro | Enterprise |
|---|---|---|---|
| Core memory system | Yes | Yes | Yes |
| Max users per folder | 2 | Unlimited | Unlimited |
| Cloud sync (Supabase) | Yes | Yes | Yes |
| Hub (multi-folder) | - | Yes | Yes |
| File storage | - | Yes | Yes |
| Smart context (semantic search) | - | Yes | Yes |
| Team sharing | - | Yes | Yes |
| MCP server access | Yes | Yes | Yes |
| Custom modules | - | Yes | Yes |
| Centralized management | - | - | Yes |

---

## Legal

MLS Core is proprietary software created by Rabbithole LLC.
Redistribution, resale, or creation of derivative products is prohibited without written permission.

See [LICENSE](./LICENSE) for full terms.
