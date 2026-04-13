# MLS Core Changelog

---

## v4.0.0 — 2026-04-13

### Security Hardening

- **Credential cleanup across all skills:** Replaced hardcoded Supabase anon key instances (repeated in every API call) with a single `{SUPABASE_ANON_KEY}` constant defined at the top of each skill. Reduces key sprawl and makes rotation a one-line change.
- **RBAC enforcement:** Row-level security policies on all Supabase tables. Users can only read and write their own project data. Hub members with shared access operate within explicit permission grants.
- **Gitignore hardening:** `.mls/`, `global.json`, and `mls-boot.jsx` are now blocked at the repo level — instance-specific files can no longer be accidentally committed to the product repo.
- **Migration baggage removed:** Notion→Supabase migration instructions (v3→v4 upgrade path) removed from live skills. All users are on Supabase now; the migration code was dead weight and a source of confusion.

### MCP Server Support

- **15-tool MCP server** (`@memorylayer/mcp-server`) — platform-agnostic alternative to the Claude Code plugin. Works in Claude Code, Cursor, Windsurf, and any MCP-compatible AI tool.
- **Tools:** `mls_session_start`, `mls_session_end`, `mls_push`, `mls_pull`, `mls_upload_file`, `mls_download_file`, `mls_list_files`, `mls_search`, `mls_agents_list`, `mls_agent_install`, `mls_agent_remove`, `mls_agent_run`, `mls_invite`, `mls_team`, `mls_health`.
- **Configuration docs:** Added MCP setup instructions for Claude Code, Cursor, and Windsurf to both README and plugin.json.
- **Skill note:** `mls-core-start` now documents the MCP alternative and when to use each approach.

### File Storage

- **`/upload-file` endpoint:** Push any file (text or binary) to the memorylayer.pro Files page via `/mls-push`. Files appear in the dashboard under `Files`, separate from memory entries.
- **`mls_upload_file` / `mls_download_file` / `mls_list_files`:** MCP tools for full file lifecycle — upload, retrieve, and browse stored files.
- **Binary support:** Base64 encoding path for Excel, PDF, images, Word docs — not limited to text.
- **Replaces Google Drive** as the recommended file handoff mechanism between sessions.

### Team Sharing v2

- **Conflict detection:** The `mls-pull` skill now correctly identifies the "shared project" case — when `api_key` belongs to a shared member rather than the project owner — and handles it gracefully instead of surfacing an error.
- **Shared member flow:** Linked projects owned by another hub member initialize local context files and continue in local mode. Users are instructed to use `/mls-push` to contribute session context.
- **Invite management:** `mls_invite` and `mls_team` MCP tools for managing hub membership programmatically.
- **Activity feed:** All agent runs (`mls_agent_run`) are visible to all hub members in the dashboard.

### Smart Context

- **`mls_search`:** Semantic search across all project memory using embeddings. Returns ranked results by relevance score.
- **Context compaction:** Session-end now includes smarter deduplication — repeated context entries across sessions are merged rather than appended.
- **Dynamic project picker:** `mls-core-start` now lists existing projects on connect, letting users link to an existing remote project instead of always creating a new one.

---

## v3.1.7 — 2026-04-13

- Project picker on connect: link to existing project, create new, enter project ID manually, or run local only.
- Shared project handling: "Invalid api_key or project_id" on session-start is now recognized as the expected shared-member scenario, not an error.
- File upload path in `mls-push` via `/upload-file` endpoint.
- Dynamic `global.json` path computation (no longer hardcoded to a session path).
- Config schema bumped to v3.1.7.

## v3.1.6 — 2026-04-13

- Full Achievements support.
- All skills migrated from Notion to Supabase as the sync backend.
- Plugin v3.1.6 published.

## v3.0.2 — 2026-04-13

- Plugin wired: plugin.json, real skill files, placeholder assets replaced.

## v1.0.0 — 2026-04-13

- Initial commit: MLS Core v1.0.
