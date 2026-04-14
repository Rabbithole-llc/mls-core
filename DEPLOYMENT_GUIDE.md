# MLS Core — Deployment & Integration Guide

Connect MLS Core to any AI tool using the approach that fits your setup. All four paths connect to the same memorylayer.pro backend.

---

## Quick Reference

| Approach | Best for | Setup time |
|---|---|---|
| [Plugin (Claude Code)](#1-plugin-claude-code) | Claude Code users, zero-config | ~1 min |
| [MCP Server](#2-mcp-server-claude-code--cursor--windsurf) | Claude Code, Cursor, Windsurf | ~2 min |
| [REST API](#3-rest-api-gpt--openai--any-http-client) | Any HTTP client, custom integrations | ~5 min |
| [Custom GPT](#4-custom-gpt-openai-gpts) | OpenAI GPT builder | ~10 min |

Get your API key first: [memorylayer.pro/dashboard → Settings → API Keys](https://memorylayer.pro/dashboard)

---

## 1. Plugin (Claude Code)

Install the MLS Core plugin directly into Claude Code. The plugin ships skill files that Claude reads and executes — no MCP server, no config beyond your API key.

### Install

1. Open Claude Code
2. Run `/plugins` or navigate to **Settings → Plugins**
3. Click **Install from file** and select `memory-layer-core-4.1.0.plugin`
   — or install from the marketplace at [memorylayer.pro](https://memorylayer.pro)
4. In any project folder, run `/mls-core-start`

### Available commands

| Command | Description |
|---|---|
| `/mls-core-start` | Start session — first-run setup or returning bootstrap |
| `/mls-core-stop` | Close session — write handoff, sync to cloud |
| `/mls-push` | Push local context to remote |
| `/mls-pull` | Pull remote context into local files |
| `/mls-upload` | Upload a file to the project Files page |
| `/mls-agents` | Browse and install agent modules |
| `/mls-test` | Health check — validate structure and connections |

### What gets created

Running `/mls-core-start` creates a `.mls/` directory in your project:

```
.mls/
  config.json          ← connection config, preferences, sync state
  metrics.json         ← session counts, stats
  active_session.json  ← current session ID (written at session start)
  achievements.json    ← achievement cache
  context/
    CONTEXT.md         ← project knowledge base
    TASKS.md           ← persistent task list
    CHANGELOG.md       ← session history + handoff notes
    GOALS.md           ← active goals
    FEEDBACK.md        ← behavioral feedback log
    PREFERENCES.md     ← user preferences
    CORRECTIONS.md     ← active corrections (overrides CONTEXT.md)
  modules/
    MODULE_TEMPLATE.md
```

Add `.mls/` to your `.gitignore` — these files contain your API key and personal context.

---

## 2. MCP Server (Claude Code / Cursor / Windsurf)

The MLS Core MCP server exposes all operations as typed tool calls. Works in any MCP-compatible AI tool.

**Package:** `@memorylayer/mcp-server`  
**Tools:** 15 tools covering sessions, push/pull, files, search, agents, and team management

### Claude Code

Add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "ml_your_key_here"
      }
    }
  }
}
```

Restart Claude Code. The MLS tools will appear in the tool palette.

### Cursor

Add to `.cursor/mcp.json` in your project, or `~/.cursor/mcp.json` for global:

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "ml_your_key_here"
      }
    }
  }
}
```

Restart Cursor. MLS tools are available in Composer and Chat.

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "mls-core": {
      "command": "npx",
      "args": ["-y", "@memorylayer/mcp-server"],
      "env": {
        "MLS_API_KEY": "ml_your_key_here"
      }
    }
  }
}
```

Restart Windsurf. MLS tools are available in the Cascade panel.

### Available MCP tools

| Tool | Description |
|---|---|
| `mls_session_start` | Bootstrap a session — first-run or returning |
| `mls_session_end` | Close session, write handoff, sync |
| `mls_push` | Push context entries to remote |
| `mls_pull` | Pull context from remote into local files |
| `mls_upload_file` | Upload a file (text or binary) to the Files page |
| `mls_download_file` | Download a stored file |
| `mls_list_files` | List uploaded project files |
| `mls_search` | Semantic search across project memory |
| `mls_agents_list` | Browse the agent marketplace |
| `mls_agent_install` | Install an agent module |
| `mls_agent_remove` | Remove an agent module |
| `mls_agent_run` | Log an agent run (visible to all hub members) |
| `mls_invite` | Invite a team member to the hub |
| `mls_team` | List hub members and roles |
| `mls_health` | Check connection and sync health |

### Where is `MLS_API_KEY`?

Your API key is in `.mls/config.json` in any project where you've run `/mls-core-start`:
```json
{ "supabase": { "api_key": "ml_..." } }
```
Or at [memorylayer.pro/dashboard → Settings → API Keys](https://memorylayer.pro/dashboard).

---

## 3. REST API (GPT / OpenAI / any HTTP client)

Call the memorylayer.pro backend directly from any tool that can make HTTP requests.

**Base URL:** `https://pjtqhxurdbaeatssorju.supabase.co/functions/v1`

### Authentication

Every request requires:

```
Authorization: Bearer {SUPABASE_ANON_KEY}
X-MLS-Key: ml_your_key_here
X-MLS-Edge-Version: 1
Content-Type: application/json
```

The `SUPABASE_ANON_KEY` is the public Supabase JWT for the memorylayer.pro project — it is not secret and is included in all MLS skill files. Your `X-MLS-Key` (`ml_...`) is what authenticates your account.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Create account or log in, provision project |
| `POST` | `/session-start` | Start a session, fetch remote corrections |
| `POST` | `/session-end` | Close session, write handoff note |
| `POST` | `/remember` | Push memory entries |
| `POST` | `/recall` | Pull context for a project |
| `POST` | `/file-upload` | Upload a file (text or base64 binary) |
| `POST` | `/file-ops` | List, download, or delete stored files |
| `GET` | `/projects?hub_id={id}` | List projects for a hub |
| `GET` | `/achievements` | Get achievement state |
| `GET` | `/hub-brain?project_id={id}&limit=10` | Query Community Brain |

### Push a memory entry

```bash
curl -X POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/remember \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "X-MLS-Key: ml_your_key_here" \
  -H "X-MLS-Edge-Version: 1" \
  -d '{
    "api_key": "ml_your_key_here",
    "project_id": "your-project-uuid",
    "entries": [{
      "scope": "project",
      "memory_type": "fact",
      "confidence_score": 0.9,
      "content": { "fact": "The auth system uses JWT with 7-day expiry" },
      "tags": ["architecture", "auth"]
    }]
  }'
```

### Memory types and confidence scoring

**`memory_type` options:** `context_snapshot`, `fact`, `observation`, `preference`, `action`, `feedback`

**`confidence_score`:**
- `0.9`–`1.0` — Verified (user confirmed, pulled from authoritative source)
- `0.7` — Default (inferred with reasonable certainty)
- `0.5` — Low confidence (guessed or ambiguous)

### Temporal fact tracking

When updating an existing fact, include `supersedes_entry_id` to preserve history:

```json
{
  "memory_type": "fact",
  "content": { "fact": "updated value" },
  "supersedes_entry_id": "uuid-of-old-fact-entry",
  "confidence_score": 0.9
}
```

The old fact is marked `superseded_by` the new entry. If you don't know the old entry ID, omit the field — the server uses semantic deduplication automatically.

### Pull context

```bash
curl -X POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/recall \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "X-MLS-Key: ml_your_key_here" \
  -H "X-MLS-Edge-Version: 1" \
  -d '{
    "api_key": "ml_your_key_here",
    "project_id": "your-project-uuid"
  }'
```

### Upload a file

```bash
curl -X POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/file-upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {SUPABASE_ANON_KEY}" \
  -H "X-MLS-Key: ml_your_key_here" \
  -H "X-MLS-Edge-Version: 1" \
  -d '{
    "account_key": "ml_your_key_here",
    "project_id": "your-project-uuid",
    "filename": "notes.md",
    "content": "# My Notes\n\nContent here...",
    "description": "Session notes"
  }'
```

For binary files, base64-encode the content and add `"content_encoding": "base64"` and `"content_type": "application/pdf"` (or the appropriate MIME type).

Full API reference: [memorylayer.pro/docs/api](https://memorylayer.pro/docs/api)

---

## 4. Custom GPT (OpenAI GPTs)

Connect MLS Core to an OpenAI Custom GPT via the Actions system.

### Setup

1. Go to [platform.openai.com](https://platform.openai.com) → **My GPTs → Create a GPT**
2. In the **Configure** tab, scroll to **Actions → Create new action**
3. Set **Authentication** to **API Key**, header name `X-MLS-Key`, value: your `ml_...` key
4. In the **Schema** field, import the MLS Core OpenAPI spec from [memorylayer.pro/docs/openapi](https://memorylayer.pro/docs/openapi)
5. Update the server URL in the schema to: `https://pjtqhxurdbaeatssorju.supabase.co/functions/v1`

### System prompt additions

Add to the GPT's system prompt so it knows to use MLS automatically:

```
You have access to MLS Core memory tools via Actions. 

At the start of every conversation:
- Call `recall` with project_id "{your-project-uuid}" to load context.
- Read the returned entries and internalize the project knowledge.

At the end of every conversation (or when the user says "save context", "sync", or "push"):
- Call `remember` with a `context_snapshot` entry containing a summary of what was worked on.
- Include a "For Next Agent" handoff note in the content.

Your project_id is: {your-project-uuid}
```

### GPT instructions for memory types

Include this in the system prompt to get typed memory entries:

```
When pushing to memory, choose the correct memory_type:
- "fact" — objective project decisions, architecture choices, config values
- "observation" — patterns you noticed, code quality notes, user behavior
- "preference" — how the user likes to work, communication style, tooling choices
- "action" — what was done this session, commands run, files changed
- "feedback" — corrections, positive feedback, things to do differently

Always set confidence_score:
- 0.9 for things the user explicitly confirmed
- 0.7 for things you're reasonably certain about
- 0.5 for guesses or ambiguous signals
```

### Limitations vs. plugin/MCP

- No local `.mls/` files — context is cloud-only
- No `/mls-core-start` visual UI — context is loaded/saved inline
- No agent marketplace — `mls_agent_*` tools are not available in GPT Actions
- File uploads work via the `file-upload` endpoint directly

---

## Choosing the Right Approach

| You have | Use |
|---|---|
| Claude Code | Plugin (Approach A) — zero config, works immediately |
| Claude Code + want typed tools | MCP Server (Approach B) |
| Cursor | MCP Server (Approach B) |
| Windsurf | MCP Server (Approach B) |
| Any other AI tool with HTTP support | REST API (Approach C) |
| OpenAI Custom GPT | Custom GPT Actions (Approach D) |
| Multiple tools | MCP Server or REST API — both work everywhere |

All approaches share the same backend, the same `project_id`, and the same memory. You can push from Claude Code and pull in Cursor — they see the same context.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `401 Unauthorized` | Check `MLS_API_KEY` / `X-MLS-Key` — must be your `ml_...` account key |
| `"Invalid api_key or project_id"` | Normal for shared projects — your key is a member key, not the owner key. Run locally and use `/mls-push` to contribute. |
| MCP tools not appearing | Restart the AI tool after adding the MCP config. Verify `npx @memorylayer/mcp-server` runs without error. |
| Plugin not loading | Make sure the `.plugin` file is v4.1.0. Re-install via Claude Code Settings → Plugins. |
| Push rejected (tier limit) | Free tier: 3 projects, 30-day history. Upgrade at memorylayer.pro/dashboard. |
| Network timeout | Check `~/.mls/sync_health.json` — circuit breaker may be open. Wait 15 minutes. |

Support: [memorylayer.pro](https://memorylayer.pro) — dashboard has a help link.
