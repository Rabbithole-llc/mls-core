---
name: mls-push
description: "Push local MLS Core context to Supabase. Does not require a full session close. Trigger on /mls-push, 'sync up', 'push context', 'save to remote', or 'push to supabase'."
---

# MLS Core — Push to Remote

You are pushing local MLS Core context to Supabase. This is a standalone sync operation — it doesn't require a full session close.

**When to use this:**
- Mid-session when you want remote storage to reflect your latest progress
- After making significant context/task changes
- Before handing off to a teammate who will access context via remote storage

---

## Step 0: Validate MLS Core

1. Check `.mls/config.json` exists and `initialized` is `true`.
2. Check for `sync.primary` configuration. In v3.1.0+, this must be `"supabase"`.
3. Check for `supabase.api_key` and `supabase.api_base`. If missing:
   > "Supabase sync not configured. Run `/mls-core-start` to connect your account."
4. If `sync.primary = "local"`: Abort push immediately.
   > "Sync is configured for 'local' only. To enable remote push, run `/mls-core-start` and connect your memorylayer.pro account."
5. Check for `sync` block in config.json. If missing, add defaults.

**Self-heal:** If config.json is invalid JSON, attempt to repair. If unrecoverable, inform user and abort push.

### Tier Check

Read `config.json > license.tier`:

- **If `supabase.api_key` is null:** Push is unavailable. "Cloud sync isn't configured. Register at https://memorylayer.pro to enable sync, or run `/mls-core-start` to set up your API key."
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
   | `closed` | Proceed to Step 2 normally |
   | `open`, last_failure_at < 15 min ago | Skip push → inform user circuit is open, retry later |
   | `open`, last_failure_at ≥ 15 min ago | Flip to `half-open`, attempt Step 2 as a single test call |
   | `half-open` | Attempt once — success resets to `closed`, failure returns to `open` |

3. **After the push call, update sync_health.json.** Auth errors (401/403) = config error, not a circuit trip.

---

## Step 2: Push to Supabase

**Supabase anon key** — use as the `Authorization: Bearer` value for all edge function calls in this skill:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

1. Extract credentials from `.mls/config.json`:
   - `api_key` from `supabase.api_key`
   - `api_base` from `supabase.api_base`
   - If missing, abort and inform user.

2. Attempt to read `.mls/active_session.json` for `session_id`. If not present, use `"unknown"`.

3. **Determine hub_shared stamp** — read live from config, never cache:
   ```
   hub_shared = config.json > hub.share_intelligence === true
              AND config.json > license.tier !== "free"
   hub_id     = hub_shared ? config.json > hub.id : omit
   ```

4. Build memory entries from local state and stamp each with hub fields.

**Memory type categories** — set `memory_type` based on the nature of the entry:

| `memory_type` | Use for |
|---|---|
| `context_snapshot` | Full project context dump (CONTEXT.md + GOALS.md + TASKS.md + CHANGELOG) |
| `fact` | Objective facts about the project (decisions, architecture, config) |
| `observation` | Agent observations about patterns, user behavior, code quality |
| `preference` | User preferences and working style notes |
| `action` | Things the agent did or was asked to do this session |
| `feedback` | Corrections, positive/negative feedback, behavioral guidance |

**Confidence scoring** — set `confidence_score` on every entry:

| Score | Meaning | When to use |
|---|---|---|
| `0.9`–`1.0` | Verified | Explicitly confirmed by user, pulled from authoritative source (config, code) |
| `0.7` | Default | Inferred from context with reasonable certainty |
| `0.5` | Low confidence | Guessed or inferred from ambiguous signals |

Default to `0.7` if confidence is not explicitly determined.

**Temporal fact tracking** — when pushing a `fact` entry that updates an existing fact, set `superseded_by` on the old fact rather than deleting it. This preserves history. The `/remember` endpoint handles supersession server-side when `supersedes_entry_id` is provided:

```json
{
  "memory_type": "fact",
  "content": { "fact": "new value" },
  "supersedes_entry_id": "[id of the old fact entry, if known]"
}
```

If the entry ID of the old fact is not known locally, omit `supersedes_entry_id` — the server will use semantic deduplication to detect and link superseded facts automatically.

**Full entry schema:**
   ```json
   {
     "api_key": "{supabase.api_key}",
     "project_id": "{supabase.project_id}",
     "entries": [
       {
         "scope": "project",
         "memory_type": "context_snapshot",
         "confidence_score": 0.9,
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

5. Make POST request to `{config.json > supabase.api_base}/remember` with the above payload:
   ```
   Content-Type: application/json
   Authorization: Bearer {SUPABASE_ANON_KEY}
   X-MLS-Edge-Version: 1
   ```

6. **On success (200-201):**
   - Update circuit breaker: success, reset to `closed`.
   - Proceed to Step 3.

7. **On failure (4xx/5xx or timeout):**
   - Log error (status code + user-friendly message only).
   - Update circuit breaker: failure, increment count.
   - Inform user and abort.

---

## Step 2.5: File Uploads (when the user asks to upload a file)

**If the user asks to "upload a file", "attach a file", or "push a file" — use the `/upload-file` endpoint, NOT `memory_type: "file"` in `/remember`.** Files uploaded via `/upload-file` appear in the Files page on the dashboard. Memory entries do not.

### When to use `/upload-file`
- User explicitly says "upload [filename]", "attach this file", or "add this to files"
- User shares a file path or file content and wants it stored
- Any time the intent is for the file to appear in `memorylayer.pro/dashboard → Files`

### How to upload a file

```
POST {config.json > supabase.api_base}/upload-file
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}
X-MLS-Edge-Version: 1

{
  "account_key": "{config.json > supabase.api_key}",
  "project_id":  "{config.json > supabase.project_id}",
  "filename":    "notes.md",
  "content":     "[full file content as UTF-8 string]",
  "description": "[optional description]",
  "session_id":  "[active session ID from active_session.json, or null]"
}
```

For **binary files** (Excel, PDF, images, Word docs): read the file as base64 and add `"content_encoding": "base64"` to the body.

For **text files** (`.md`, `.txt`, `.csv`, `.json`, etc.): pass raw UTF-8 string content directly, no encoding needed.

**On success (201):** confirm "Uploaded [filename] ✓ — visible at memorylayer.pro/dashboard → Files."

**On failure:** report the error clearly. Do NOT fall back to storing as a memory entry — that puts the file in the wrong place.

### What NOT to do
- **Never** use `memory_type: "file"` in `/remember` for user file uploads. That stores text blobs in the context database, not the Files storage — files stored that way won't appear on the Files page.
- The `/remember` endpoint is only for session context (CONTEXT.md, GOALS.md, TASKS.md, CHANGELOG.md, corrections, handoffs).

---

## Step 3: Update Local Sync State

Update `config.json > sync`:
- `last_push` → current ISO timestamp
- `last_push_target: "supabase"`

**Community Brain contribution happens automatically.** When memory entries are written with `hub_shared: true`, they appear in Community Brain queries for other hub members. No separate step needed.

---

## Step 4: Confirm

> "Pushed to Supabase. Memory entries synced."
> "Dashboard: https://memorylayer.pro/dashboard"

---

## Error Recovery

| Problem | Recovery |
|---|---|
| Supabase API timeout | Retry once. If still fails, inform user. Local state unchanged. |
| Supabase API auth error (401) | Config error — do not trip circuit breaker. Inform user to check credentials. |
| Supabase request body too large | Truncate changelog to last 3 entries. Truncate context to first 2000 chars. Retry. |
| No primary target configured | Abort push and inform user to run `/mls-core-start` to configure sync. |
| Circuit breaker open | Skip push. Inform user. Retry after 15 minutes. |

---

## Important Rules

- **Supabase is the only sync target.** There is no Notion fallback.
- **Never push broken state.** Validate local files before pushing.
- **Push is non-destructive locally.** It reads local state and writes to remote. It never modifies local files (except sync timestamps).
- **All registered users can push to Supabase.** Free tier has server-side limits (3 projects, 30-day history). If the server rejects, surface the error clearly.
- **Tier limits are transparent.** If a push is rejected by the server for tier reasons, clearly tell the user why and suggest upgrading. Never silently skip.
- **Hub sharing is automatic.** Writing memory entries with `hub_shared: true` automatically contributes to the Community Brain for hub members. No extra step.
- **Sanitize error messages.** Never display API response bodies, stack traces, or the API key in error output. Status code + user-friendly message only.
- **MLS Core is proprietary software by Rabbithole LLC.**
