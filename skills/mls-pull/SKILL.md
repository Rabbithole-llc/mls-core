---
name: mls-pull
description: "Pull remote context into local MLS Core files from Supabase. Essential for multi-machine workflows. Trigger on /mls-pull, 'sync down', 'pull context', 'get latest', 'refresh from remote', or 'pull from supabase'."
---

# MLS Core — Pull from Remote

You are pulling the latest project context from Supabase into local MLS Core files. This is essential when:
- Another user/agent updated context via Supabase from another machine
- You want to ensure local files reflect the latest team state
- You're starting work on a machine that hasn't been synced recently

---

## Step 0: Validate MLS Core

1. Check `.mls/config.json` exists and `initialized` is `true`.
2. Check for `sync.primary` in config.json. In v3.1.0+, this is always `'supabase'`.
3. Check for `supabase.api_key`. If `null` or not set:
   > "No Supabase sync configured. Run `/mls-core-start` to connect your account, or run locally without cloud sync."
4. Check for `sync` block in config.json. If missing, add defaults (primary: 'supabase', conflict_resolution: 'ask_user').

**Self-heal:** If config.json is invalid, attempt repair. If `.mls/` structure is damaged, repair it first.

### Tier Check

Read `config.json > license.tier`:

- **If `supabase.api_key` is null:** Pull is unavailable in cloud mode. "Cloud sync isn't configured. Register at https://memorylayer.pro to enable sync, or run `/mls-core-start` to set up your API key."
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
   | `closed` | Proceed to Step 1 normally |
   | `open`, last_failure_at < 15 min ago | Skip pull → inform user the circuit is open, suggest retrying later |
   | `open`, last_failure_at ≥ 15 min ago | Flip to `half-open`, attempt Step 1 as a single test call |
   | `half-open` | Attempt once — success resets to `closed`, failure returns to `open` |

3. **After the pull call, update sync_health.json.** Auth errors (401/403) = config error, not a circuit trip.

---

## Step 1: Pull from Supabase

**Supabase anon key** — use as the `Authorization: Bearer` value for all edge function calls in this skill:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

**Only execute this step if `supabase.api_key` is set.**

1. **Check API key:**
   - Read `config.json > supabase.api_key`.
   - If `null` or empty, inform user and stop: "No Supabase credentials. Run `/mls-core-start` to connect."

2. **Fetch from Supabase:**
   - Make a POST request to `{config.json > supabase.api_base}/session-start` with:
     ```
     Headers:
       Content-Type: application/json
       Authorization: Bearer {SUPABASE_ANON_KEY}
       X-MLS-Edge-Version: 1

     Body:
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
   - The `start_type: "pull_only"` flag indicates this is a data pull — no session row is created.

3. **Handle Supabase response:**
   - **On success (HTTP 200):**
     - Extract `project_memory` — the project-scoped memory entries.
     - Extract `installed_agents` for agent memory sync.
     - Proceed to **Step 2: Determine Pull Strategy**.
   - **On "Invalid api_key or project_id" (the exact error string in the response body):**
     - This is the **shared project case** — the project was created by another user and this api_key belongs to a shared member. This is a valid configuration, not a bug or misconfiguration.
     - Do NOT update the circuit breaker (this is not a network failure).
     - Do NOT say the api_key is wrong or suggest re-running `/mls-core-start`.
     - Inform user with exactly this message: "This project is owned by another hub member — cloud pull isn't available with your key, but local context is intact. You can still push your own session context with `/mls-push`."
     - Stop gracefully — local files are unchanged, which is correct.
   - **On any other error (HTTP 4xx/5xx or timeout):**
     - Log the error (status code + user-friendly message only — never display API keys or response bodies).
     - Update circuit breaker state.
     - Inform user: "Supabase pull failed ([status]). Local state unchanged."
     - Stop — do not proceed.

4. **If pull succeeds:**
   - Parse `project_memory` entries by `memory_type` key to reconstruct file contents:
     - `"context_snapshot"` → contains `context`, `goals`, `tasks`, `changelog` fields
     - `"handoff"` → contains the latest For Next Agent content
     - `"corrections"` → active corrections list
   - Use the most recently updated entry per memory_type.
   - Surface the remote handoff prominently — it's the most actionable piece of context.

---

## Step 2: Determine Pull Strategy

Compare local file timestamps vs Supabase entry `updated_at`:

- **Remote is newer:** Proceed to merge/overwrite.
- **Remote and local have same timestamp:** Already in sync. Inform user:
  > "Local and remote are already in sync. No changes to pull."
- **Local is newer:** This is unusual for a pull. Warn user:
  > "Local files are newer than the remote snapshot. You may have unpushed changes. Pull anyway? This could overwrite local work."

### Option A: Clean Pull (remote is newer, no local changes since last sync)

If local hasn't been modified since `sync.last_pull` or `sync.last_push`:
- Overwrite local files with remote content.
- This is the fast path — no merge needed.

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
   - **TASKS.md:** Merge task lists (union of both sides, deduplicate by task name).
   - **CHANGELOG.md:** Interleave by session number. Both sides' entries are kept.
   - **Agent Notes / Last Handoff:** Take the most recent (by updated_at timestamp).

### Option C: Force Pull (user explicitly chose "remote wins")

Overwrite all local context files with remote content. Back up local files to `.mls/context/backup/` first.

---

## Step 3: Write Local Files

Based on the chosen strategy, update:

### CONTEXT.md
- Parse the `context` field from the latest `context_snapshot` memory entry.
- Write to `.mls/context/CONTEXT.md`.

### GOALS.md
- Parse the `goals` field from the latest `context_snapshot` memory entry.
- Write to `.mls/context/GOALS.md`.

### TASKS.md
- Parse the `tasks` field from the latest `context_snapshot` memory entry.
- Write to `.mls/context/TASKS.md`.

### CHANGELOG.md
- Parse the `changelog` field from the latest `context_snapshot` memory entry.
- Merge with local entries (don't lose local-only entries).
- Write to `.mls/context/CHANGELOG.md`.

### For Next Agent (handoff)
- Parse the `handoff` memory entry content if present.
- Surface it immediately to the user — don't wait until the end.

### config.json
- Update `sync.last_pull` → current ISO timestamp.

---

## Step 4: Show What Changed

After pull completes, show a summary:

> "Pulled from Supabase (synced [N] memory entries):
> - **Context:** [added X sections / updated Y sections / no changes]
> - **Tasks:** [added X tasks / completed Y / no changes]
> - **Changelog:** [added X entries / no changes]
> - **Last handoff from remote:** '[first line of remote handoff]'"

If the remote handoff is different from what was locally, highlight it prominently — the user needs to know what the last remote agent left behind.

---

## Step 5: Confirm

> "Pull complete. Local files updated from Supabase."
> "Dashboard: https://memorylayer.pro/dashboard"

---

## Error Recovery

| Problem | Recovery |
|---|---|
| Supabase API timeout | Retry once. If still fails, inform user. Local state unchanged. |
| Supabase API auth error (401) | Config error — do not trip circuit breaker. Inform user to check api_key. |
| Supabase API key missing | Inform user, suggest `/mls-core-start`. |
| No remote memory entries found | Nothing to pull. Suggest `/mls-push` to create the first snapshot. |
| project_memory is empty | Inform user no context has been pushed yet. |
| Local files corrupted | Repair first (self-heal), then pull over them. |
| Merge conflict too complex | Show both versions to user. Let them decide. |
| Circuit breaker open | Skip pull. Inform user. Retry after 15 minutes. |

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

- **Supabase is the only sync source.** There is no Notion fallback. If Supabase is down, wait for it to recover.
- **Never overwrite local changes without warning.** Always check timestamps first.
- **Prefer full data.** Use the complete `project_memory` entries from the API response.
- **Back up before force-overwrite.** Save local files to `.mls/context/backup/` before replacing them.
- **Pull is non-destructive to remote sources.** It reads from remote and writes locally. Never modifies remote state.
- **Show what changed.** The user should always know exactly what was pulled.
- **Highlight the remote handoff.** If it changed, the user needs to see it — it's the most actionable piece of context.
- **All registered users can pull from Supabase.** Free tier may have less history available (30-day server-side limit).
- **Tier limits are transparent.** If the server returns limited data due to tier, note it once. Never block the pull client-side for tier reasons.
- **Sanitize error messages.** Never display API response bodies, stack traces, or the API key in error output. Status code + user-friendly message only.
- **MLS Core is proprietary software by Rabbithole LLC.**
