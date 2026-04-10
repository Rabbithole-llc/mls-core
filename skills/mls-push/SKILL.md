---
name: mls-push
description: "Push local MLS Core context to remote storage (Supabase primary, Notion fallback). Does not require a full session close. Trigger on /mls-push, 'sync up', 'push context', 'save to remote', 'push to supabase', or 'push to notion'."
---

# MLS Core — Push to Remote

You are pushing local MLS Core context to remote storage. This is a standalone sync operation — it doesn't require a full session close.

**When to use this:**
- Mid-session when you want remote storage to reflect your latest progress
- After making significant context/task changes
- When you want both primary and secondary targets to stay in sync without closing the session
- Before handing off to a teammate who will access context via remote storage

---

## Step 0: Validate MLS Core

1. Check `.mls/config.json` exists and `initialized` is `true`.
2. Check for `sync.primary` configuration:
   - If `sync.primary = "supabase"`: Check for `supabase.api_key` and `supabase.api_base`. If missing:
     > "Supabase sync configured but missing credentials. Add your Supabase API key and base URL to `.mls/config.json > supabase`, or change `sync.primary` to 'notion'."
   - If `sync.primary = "notion"`: Check for `notion.projects_data_source_id`. If `null` or not set:
     > "No Notion sync configured. To enable sync, run `/mls-core-start` and connect your Notion database, or manually add your Notion IDs to `.mls/config.json > notion`."
   - If `sync.primary = "local"`: Abort push immediately.
     > "Sync is configured for 'local' only. To enable remote push, change `sync.primary` to 'supabase' or 'notion'."

   **Note:** If primary sync isn't fully configured but `community_brain.enabled` is `true`, continue to push Community Brain metrics even though project sync is skipped.

3. Check for `sync` block in config.json. If missing, add defaults.

**Self-heal:** If config.json is invalid JSON, attempt to repair. If unrecoverable, inform user and abort push.

### Tier Check

Read `config.json > license.tier` and `license.local_only`:

- **If `local_only` is `true`:** Supabase push is unavailable (no API key or API unreachable). If Notion is configured, fall through to Notion push. Otherwise: "Cloud sync isn't configured. Register at https://memorylayer.pro to enable sync, or run `/mls-core-start` to set up your API key."
- **If tier is `"free"`:** Push to Supabase proceeds normally. Free users get limited cloud sync (3 projects, 30-day history). Limits are enforced server-side — the client pushes normally and handles any rejections. Never send `hub_shared: true` on free tier.
- **If tier is `"pro"`, `"team"`, or `"enterprise"`:** No push restrictions. Proceed normally.

**Principle: push never fails silently.** All registered users can push. If the server rejects due to tier limits, surface the error clearly. Never silently drop data. Local files are always safe.

---

## Step 1: Read Current Local State

Read all context files in parallel:
- `.mls/context/CONTEXT.md`
- `.mls/context/GOALS.md`
- `.mls/context/TASKS.md`
- `.mls/context/CHANGELOG.md`
- `.mls/metrics.json`
- `.mls/config.json`
- `.mls/active_session.json` (if exists)

**Self-heal:** If any context file is missing, recreate it from available information before pushing. Never push empty/broken state to remote.

---

## Step 1.5: Circuit Breaker Pre-flight

Before attempting any Supabase call:

1. **Read `~/.mls/sync_health.json`** (user-level file, shared across all projects).
   - If missing, create with defaults: `{"status":"closed","failure_count":0,"last_failure_at":null,"last_success_at":null}`

2. **Evaluate circuit status:**

   | Status | Action |
   |---|---|
   | `closed` | Proceed to Step 2a normally |
   | `open`, last_failure_at < 15 min ago | Skip Step 2a → fall through directly to Notion (Step 2) |
   | `open`, last_failure_at ≥ 15 min ago | Flip to `half-open`, attempt Step 2a as a single test call |
   | `half-open` | Attempt once — success resets to `closed`, failure returns to `open` |

3. **After the push call, update sync_health.json.** Auth errors (401/403) = config error, not a circuit trip.

---

## Step 2a: Push to Supabase (If Primary)

If `sync.primary = "supabase"`:

1. Extract credentials from `.mls/config.json`:
   - `api_key` from `supabase.api_key`
   - `api_base` from `supabase.api_base`
   - If missing, skip Supabase and fall through to Notion (if configured as secondary).

2. Attempt to read `.mls/active_session.json` for `session_id`. If not present, use `"unknown"`.

3. **Determine hub_shared stamp** — read live from config, never cache:
   ```
   hub_shared = config.json > hub.share_intelligence === true
              AND config.json > license.tier !== "free"
   hub_id     = hub_shared ? config.json > hub.id : omit
   ```

4. Build memory entries from local state and stamp each with hub fields:
   ```json
   {
     "api_key": "{supabase.api_key}",
     "project_id": "{supabase.project_id}",
     "entries": [
       {
         "scope": "project",
         "memory_type": "context_snapshot",
         "content": {
           "context": "[full CONTEXT.md content]",
           "goals": "[full GOALS.md content]",
           "tasks": "[full TASKS.md content]",
           "changelog": "[last 5 CHANGELOG entries]"
         },
         "tags": ["push", "mid-session"],
         "hub_shared": {hub_shared},
         "hub_id": "{hub_id — omit if hub_shared is false}"
       }
     ]
   }
   ```

4. Make POST request to `{config.json > supabase.api_base}/remember` with the above payload and headers:
   ```
   Content-Type: application/json
   X-MLS-Edge-Version: 1
   ```

5. **On success (200-201):**
   - Log: "Pushed to Supabase — memory entries synced."
   - Proceed to Step 3 (Push Properties to Notion if configured).

6. **On failure (4xx/5xx or timeout):**
   - Log error with details (status, response body).
   - Check if Notion is configured as secondary fallback. If yes, proceed to Step 2 (conflict check). If no, abort push.

---

## Step 2: Check for Conflicts (Notion)

If `sync.primary = "notion"` OR (`sync.primary = "supabase"` AND Notion is configured as secondary fallback):

Before pushing, fetch the current Notion row:

1. Find the project row by name in the Projects database.
2. Compare **Content Version**:
   - **Local > Notion:** Safe to push. Local has newer changes.
   - **Local == Notion:** No changes to push. Inform user.
   - **Local < Notion:** **CONFLICT.** Someone pushed from another session/machine.

### Conflict Resolution

Based on `config.json > sync.conflict_resolution`:

- **`ask_user`** (default): Present the conflict:
  > "Notion has version [N] but local is version [M]. Another session pushed changes since your last sync. Options:
  > 1. **Force push** — overwrite Notion with your local state
  > 2. **Pull first** — download Notion changes, merge, then push
  > 3. **Diff** — show me what changed on both sides
  > 4. **Cancel** — abort push"

- **`local_wins`**: Force push without asking.
- **`remote_wins`**: Abort push. Tell user to pull first.
- **`merge`**: Attempt automatic merge (see Merge Strategy below).

### Merge Strategy

When merging:
- **CONTEXT.md:** Append new sections from remote. Update existing sections where remote is newer (compare by section header). Never delete sections.
- **TASKS.md:** Merge Active/Up Next/Blocked lists (union of both). Completed tasks from either side are preserved.
- **CHANGELOG.md:** Interleave by session number. Both sides' entries are kept.
- **Metrics:** Take the higher session count. Merge user lists (union).

After merge, Content Version = max(local, remote) + 1.

---

## Step 3: Push Properties (Notion)

If Notion is being used (primary or secondary fallback):

Update the Notion row with all properties (same as session close Step 7a):

- Project Name, Status, Owner, Tier, MLS Version, Tags
- Last Handoff, Active Task Count, Key Blockers, Last Session Date
- Context (condensed if >2000 chars), Active Tasks, Changelog (last 3-5), Agent Notes
- Session Count, Time Saved, Users, Content Version (increment)
- Last Synced (now)

---

## Step 4: Push Page Body (Notion)

If Notion is being used (primary or secondary fallback):

Replace the Notion page body with full structured content (same format as session close Step 7b):

```markdown
> **MLS Core Project Page** — Automatically synced from local `.mls/` directory.

---

# 🎯 For Next Agent
[Latest handoff]

---

# 📋 Project Context
[Full CONTEXT.md]

---

# ✅ Tasks
[Full TASKS.md]

---

# 📓 Session Changelog
[Last 3-5 entries]

---

# 🤖 Agent Configuration
[Active modules, settings, behavior notes]

---

# 📊 Metrics
[Metrics table]
```

**Self-heal:** If page body write fails (child pages, permissions), try clearing first. If still fails, log error — properties are already pushed.

**Security note:** Push writes the full project context to Notion. Ensure the page access is set to 'Private' or 'Workspace only'. Never include raw API keys, passwords, or credentials in context files — they will be synced to remote storage.

---

## Step 5: Update Local Sync State

Update `config.json > sync`:
- `last_push` → current ISO timestamp
- Increment local Content Version to match what was pushed
- If primary was Supabase, also record: `last_push_target: "supabase"`
- If fallback to Notion, also record: `last_push_target: "notion"`

---

## Step 5b: Sync to Community Brain

If `config.json > community_brain.enabled` is `true` and `community_brain.project_row_id` is not null:

1. Update the project row in the Community Brain Connected Projects database (data source ID from `config.json > community_brain.connected_projects_data_source_id`):
   - Sessions — from metrics.json > sessions.total
   - Avg Rating — from metrics.json > feedback.avg_satisfaction
   - Top Tags — top 3 tags by count from metrics.json > session_tags (as JSON array)
   - Goals Completed — from metrics.json > goals.completed
   - Goals Active — from metrics.json > goals.active
   - Corrections — from metrics.json > corrections.total_logged
   - Patterns — from metrics.json > feedback.patterns_identified
   - Time Saved (hrs) — estimated: (sessions.total * 8) / 60
   - Last Sync — today's date

2. If update succeeds, append to the confirm message: "Community Brain leaderboard updated."
3. If it fails, continue — community brain sync is non-blocking.

---

## Step 6: Confirm

Compose confirmation message based on what was synced:

If Supabase was primary target:
> "Pushed to Supabase. Memory entries synced. Content version: [N]."

If Notion was used (primary or fallback):
> "Pushed to Notion. Properties and page content updated. Content version: [N]."
> "Dashboard: [resolved URL]"

If both were synced:
> "Pushed to both Supabase and Notion. All remote targets updated. Content version: [N]."

If Community Brain updated:
> "🧠 Community Brain: https://www.notion.so/33733b46f2f281c8b1dcf5baa3f2cf0e"

---

## Error Recovery

| Problem | Recovery |
|---|---|
| Supabase API timeout | Retry once. If still fails, fall through to Notion if configured. If Notion also fails, inform user. |
| Supabase API auth error | Log error. If Notion is secondary fallback, attempt Notion sync. Otherwise inform user to check credentials. |
| Supabase request body too large | Truncate changelog to last 3 entries. Truncate context to first 2000 chars. Retry. If still fails, fall through to Notion. |
| Notion API timeout | Retry once. If still fails, inform user. Local state unchanged. |
| Notion API auth error | Inform user. Suggest checking Notion integration permissions. |
| Content too large for property | Truncate to 2000 chars for property fields. Page body has no limit. |
| Page body write fails | Properties already pushed. Log warning. |
| Config.json missing sync block | Add defaults and continue. |
| No primary target configured | Abort push and inform user to configure sync target. |

---

## Important Rules

- **Supabase is the primary target by default.** If configured, all pushes go to Supabase first. Notion is a secondary fallback.
- **Never push broken state.** Validate local files before pushing.
- **Always check for conflicts first (Notion only).** Silent overwrites destroy trust.
- **Always push both properties AND body (Notion).** Properties for the table view, body for the detail view.
- **Push is non-destructive locally.** It reads local state and writes to remote. It never modifies local files (except sync timestamps).
- **Failover is graceful.** If primary sync fails and secondary is configured, attempt secondary without requiring user intervention.
- **All registered users can push to Supabase.** Free tier has server-side limits (3 projects, 30-day history). If the server rejects, surface the error and fall through to Notion if configured.
- **Tier limits are transparent.** If a push is rejected by the server for tier reasons, clearly tell the user why and suggest upgrading. Never silently skip.
- **Sanitize error messages.** Never display API response bodies, stack traces, or the API key in error output. Status code + user-friendly message only.
- **MLS Core is proprietary software by Rabbithole LLC.**
