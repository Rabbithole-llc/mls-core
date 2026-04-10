---
name: mls-pull
description: "Pull remote context into local MLS Core files from Supabase (primary) or Notion (fallback). Essential for multi-machine workflows. Trigger on /mls-pull, 'sync down', 'pull context', 'get latest', 'refresh from remote', or 'pull from supabase'."
---

# MLS Core — Pull from Remote

You are pulling the latest project context from Supabase or Notion into local MLS Core files. This is essential when:
- Another user/agent updated context via Supabase or Notion from another machine
- You want to ensure local files reflect the latest team state
- You're starting work on a machine that hasn't been synced recently
- Someone edited the remote database directly and you want those changes locally

---

## Step 0: Validate MLS Core

1. Check `.mls/config.json` exists and `initialized` is `true`.
2. Check for `sync.primary` in config.json. This should be either `'supabase'` or `'notion'`.
3. If `sync.primary = 'supabase'`:
   - Check for `supabase.api_key`. If `null` or not set, fall through to Notion.
   - Proceed to **Step 1a: Pull from Supabase** below.
4. If `sync.primary = 'notion'` OR Supabase is not configured:
   - Check for `notion.projects_data_source_id`. If `null` or not set:
     > "No Notion or Supabase sync configured. To enable sync, run `/mls-core-start` and connect your database, or manually add IDs to `.mls/config.json > sync` and `supabase`/`notion`."
5. Check for `sync` block in config.json. If missing, add defaults (primary: 'notion', conflict_resolution: 'merge').

**Self-heal:** If config.json is invalid, attempt repair. If `.mls/` structure is damaged, repair it first (see self-heal table in start skill).

### Tier Check

Read `config.json > license.tier` and `license.local_only`:

- **If `local_only` is `true`:** Supabase pull is unavailable (no API key or API unreachable). If Notion is configured, fall through to Notion pull. Otherwise: "Cloud sync isn't configured. Register at https://memorylayer.pro to enable sync, or run `/mls-core-start` to set up your API key."
- **If tier is `"free"`:** Supabase pull works normally. Free users get limited cloud sync (30-day history — older entries may have been pruned server-side).
- **If tier is `"pro"`:** Supabase pull works with no limits.
- **If tier is `"team"` or `"enterprise"`:** Pull may include team memory entries from other users. Surface these prominently.

**Principle: all registered users can pull from Supabase.** Free tier may receive less history (30-day limit). Local files are always the source of truth.

### Circuit Breaker Pre-flight

Before attempting any Supabase call:

1. **Read `~/.mls/sync_health.json`** (user-level, shared across all projects).
   - If missing, create with defaults: `{"status":"closed","failure_count":0,"last_failure_at":null,"last_success_at":null}`

2. **Evaluate circuit status:**

   | Status | Action |
   |---|---|
   | `closed` | Proceed to Step 1a normally |
   | `open`, last_failure_at < 15 min ago | Skip Step 1a → fall through to Notion (Step 1b) |
   | `open`, last_failure_at ≥ 15 min ago | Flip to `half-open`, attempt Step 1a as a single test call |
   | `half-open` | Attempt once — success resets to `closed`, failure returns to `open` |

3. **After the pull call, update sync_health.json.** Auth errors (401/403) = config error, not a circuit trip.

---

## Step 1a: Pull from Supabase (Primary Sync Source)

**Only execute this step if `sync.primary = 'supabase'` AND `supabase.api_key` is set.**

1. **Check API key:**
   - Read `config.json > supabase.api_key`.
   - If `null` or empty, skip to **Step 1b: Pull from Notion**.

2. **Fetch from Supabase:**
   - Make a POST request to `{config.json > supabase.api_base}/session-start` with headers `Content-Type: application/json`, `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4`, and `X-MLS-Edge-Version: 1`, body:
     ```json
     {
       "api_key": "{config.json > supabase.api_key}",
       "project_id": "{config.json > supabase.project_id}",
       "start_type": "pull_only",
       "load": {
         "scopes": ["project", "agent_portable", "agent_project"],
         "include_corrections": true,
         "include_last_handoff": true
       }
     }
     ```
   - The `start_type: "pull_only"` flag indicates this is a data pull, not a full session initialization.
   - If the API doesn't support `pull_only` mode, alternatively read memory entries directly from the configured scopes.

3. **Handle Supabase response:**
   - **On success (HTTP 200):**
     - Extract server memory for `project`, `agent_portable`, and `agent_project` scopes.
     - Proceed to **Step 2: Compare Versions** (use Supabase data as remote state).
   - **On error (HTTP 4xx/5xx):**
     - Log the error (e.g., "Supabase API error: [status] [message]").
     - Inform user: "Supabase pull failed. Falling back to Notion sync."
     - Fall through to **Step 1b: Pull from Notion**.

4. **If Supabase pull succeeds:**
   - Continue with version comparison and merge logic using Supabase as the remote source.
   - When showing what changed, mention "Pulled from Supabase" instead of "Pulled from Notion".
   - Surface the remote handoff prominently — it's the most actionable piece of context.

---

## Step 1b: Pull from Notion (Fallback)

**Execute this step if:**
- `sync.primary = 'notion'`, OR
- `sync.primary = 'supabase'` but Supabase pull failed/skipped (no API key), OR
- User explicitly requests Notion sync.

1. Search the Projects database for a row matching `config.json > project.name`.
2. If no row found:
   > "No Notion row found for this project. Nothing to pull. Use /mls-push to create it."
3. If found, read:
   - All properties (Context, Active Tasks, Changelog, Last Handoff, Agent Notes, Key Blockers, Content Version, etc.)
   - The page body (full structured content)

---

## Step 2: Compare Versions

Compare **Content Version** (Remote vs Local):

- **Remote > Local:** Remote has newer changes. Proceed to merge/overwrite.
- **Remote == Local:** Already in sync. Inform user:
  > "Local and remote are already in sync (version [N]). No changes to pull."
- **Remote < Local:** Local is newer. This is unusual for a pull. Warn user:
  > "Local is newer than remote (local v[N] vs remote v[M]). You may have unpushed changes. Pull anyway? This could overwrite local work."

---

## Step 3: Pull Strategy

Based on `config.json > sync.conflict_resolution` and the version comparison:

### Option A: Clean Pull (remote is newer, no local changes since last sync)

If local hasn't been modified since `sync.last_pull` or `sync.last_push`:
- Overwrite local files with remote content
- This is the fast path — no merge needed

### Option B: Merge Pull (both sides have changes)

If local has been modified since last sync AND remote is also newer:

1. **Show the user what changed on each side:**
   > "Both local and remote have changes since last sync:
   > - **Remote changes:** [summary of what's different in remote]
   > - **Local changes:** [summary of what's different locally]
   >
   > Options:
   > 1. **Merge** — combine both sets of changes (recommended)
   > 2. **Remote wins** — overwrite local with remote state
   > 3. **Local wins** — keep local state, skip pull
   > 4. **Cancel**"

2. **If merge is chosen:**
   - **CONTEXT.md:** Merge by section. For each `##` header:
     - If section exists only in remote → add it locally
     - If section exists only locally → keep it
     - If section exists in both → keep the longer/more detailed version, or combine if they cover different aspects
   - **TASKS.md:** Merge task lists:
     - Active: union of both lists (deduplicate by task name)
     - Completed: union (remote completions + local completions)
     - Blocked: union
     - Up Next: union
   - **CHANGELOG.md:** Interleave by session number. Both sides' entries are kept.
   - **Agent Notes / Last Handoff:** Take the most recent (by Last Session Date)

### Option C: Force Pull (user explicitly chose "remote wins")

Overwrite all local context files with remote content. Back up local files to `.mls/context/backup/` first.

---

## Step 4: Write Local Files

Based on the chosen strategy, update:

### CONTEXT.md
- Parse the remote `Context` property OR the page/API body `# 📋 Project Context` section (page body is preferred — it's unabridged)
- Write to `.mls/context/CONTEXT.md`

### TASKS.md
- Parse the remote `Active Tasks` property OR the page/API body `# ✅ Tasks` section
- Write to `.mls/context/TASKS.md`

### CHANGELOG.md
- Parse the remote `Changelog` property OR the page/API body `# 📓 Session Changelog` section
- Merge with local entries (don't lose local-only entries)
- Write to `.mls/context/CHANGELOG.md`

### metrics.json
- Update Content Version to match remote
- Merge user lists (union)
- Take higher session count
- Recalculate time saved

### config.json
- Update `sync.last_pull` → current ISO timestamp
- Update Content Version to match post-merge version

---

## Step 5: Show What Changed

After pull completes, show a summary:

> "Pulled from [Supabase/Notion] (version [N] → [M]):
> - **Context:** [added X sections / updated Y sections / no changes]
> - **Tasks:** [added X tasks / completed Y / no changes]
> - **Changelog:** [added X entries / no changes]
> - **Last handoff from remote:** '[first line of remote handoff]'"

If the remote handoff is different from what was locally, highlight it prominently — the user needs to know what the last remote agent left behind.

---

## Step 6: Confirm

> "Pull complete. Local files updated to version [N]."
> "Dashboard: [resolved URL]"

---

## Pull from Page Body vs Properties vs API Response

The remote data has multiple layers depending on source:

### Supabase
1. **API response** — structured JSON with memory entries for scopes. Complete and unabridged.
2. Use API response directly; parse sections by markers or metadata keys.

### Notion
1. **Properties** — condensed, used for database table view. Context is truncated to 2000 chars.
2. **Page body** — full, structured content. Complete CONTEXT.md, TASKS.md, CHANGELOG.md.

**Always prefer the largest available data source:**
- Supabase: Use API response (unabridged)
- Notion: Prefer page body over properties

Pull order for Notion:
1. Fetch page body via `notion-fetch` tool
2. Parse sections by headers (`# 📋 Project Context`, `# ✅ Tasks`, etc.)
3. If page body is empty or can't be parsed, fall back to properties
4. If properties are also empty, inform user nothing to pull

---

## Error Recovery

| Problem | Recovery |
|---|---|
| Supabase API timeout | Log error. Retry once. If still fails, fall back to Notion. |
| Supabase API auth error | Log error. Inform user. Fall back to Notion. |
| Supabase API key missing | Skip to Notion. Inform user (optional). |
| Notion API timeout | Retry once. If still fails, inform user. Local state unchanged. |
| Notion API auth error | Inform user. Suggest checking permissions. |
| No remote row/entry found | Nothing to pull. Suggest /mls-push to create the entry. |
| Page body/API response empty | Fall back to properties for pull data (Notion only). |
| Properties empty | Nothing to pull. Inform user. |
| Local files corrupted | Repair first (self-heal), then pull over them. |
| Merge conflict too complex | Show both versions to user. Let them decide. |

---

## Advanced: Selective Pull

If the user wants to pull only specific sections:

> "/mls-pull context" → only pull CONTEXT.md
> "/mls-pull tasks" → only pull TASKS.md
> "/mls-pull handoff" → only pull the latest For Next Agent note
> "/mls-pull changelog" → only pull CHANGELOG.md

Parse the argument and only update the specified file(s).

---

## Important Rules

- **Supabase is the primary sync source.** Check `sync.primary` first. If Supabase is configured and available, use it.
- **Fall back to Notion gracefully.** If Supabase fails or is not configured, automatically pull from Notion without losing work.
- **Never overwrite local changes without warning.** Always check versions first.
- **Prefer full data over summaries.** Use API responses (Supabase) and page bodies (Notion) over properties. They're complete; properties are condensed.
- **Back up before force-overwrite.** Save local files to `.mls/context/backup/` before replacing them.
- **Pull is non-destructive to remote sources.** It reads from remote and writes locally. Never modifies remote state.
- **Show what changed.** The user should always know exactly what was pulled and from which source.
- **Highlight the remote handoff.** If it changed, the user needs to see it — it's the most actionable piece of context.
- **All registered users can pull from Supabase.** Free tier may have less history available (30-day server-side limit). Notion pull also works on all tiers.
- **Tier limits are transparent.** If the server returns limited data due to tier, note it once. Never block the pull client-side for tier reasons.
- **Sanitize error messages.** Never display API response bodies, stack traces, or the API key in error output. Status code + user-friendly message only.
- **MLS Core is proprietary software by Rabbithole LLC.**
