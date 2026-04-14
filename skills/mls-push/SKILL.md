---
name: mls-push
description: "Save context to the cloud. Run /mls-push anytime to sync your current work to memorylayer.pro."
---

# MLS Core — Push to Remote

Save local context to memorylayer.pro. Works mid-session — no need to close first.

**To upload a file instead**, say `/mls-upload` or "upload [filename]".

---

## Step 1: Validate

Check `.mls/config.json`:
- If missing or `initialized: false` → "Run `/mls-core-start` first."
- If `sync.primary = "local"` → "Cloud sync isn't configured. Run `/mls-core-start` to connect."
- If `supabase.api_key` is null → "No API key found. Run `/mls-core-start` to connect."

**SUPABASE_ANON_KEY** (use as `Authorization: Bearer` value for all calls):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

---

## Step 2: Read Local Files

Read in parallel (recreate from defaults if any are missing):
- `.mls/context/CONTEXT.md`
- `.mls/context/GOALS.md`
- `.mls/context/TASKS.md`
- `.mls/context/CHANGELOG.md` (last 5 entries only)
- `.mls/active_session.json` (for session_id, or use `null`)

---

## Step 3: Push

```
POST {config.json > supabase.api_base}/remember
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "api_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "entries": [
    {
      "scope": "project",
      "memory_type": "context_snapshot",
      "confidence_score": 0.9,
      "content": {
        "context": "[full CONTEXT.md]",
        "goals": "[full GOALS.md]",
        "tasks": "[full TASKS.md]",
        "changelog": "[last 5 CHANGELOG entries]"
      },
      "tags": ["push"]
    }
  ]
}
```

**Smart defaults — no user input needed:**
- `memory_type` is always `context_snapshot` for a push. Use other types when pushing specific facts (see below).
- `confidence_score`: `0.9` for file content (authoritative), `0.7` for inferred observations, `0.5` for guesses.

**On success (200-201):** update `config.json > sync.last_push` to now. Print: "Pushed ✓ — memorylayer.pro/dashboard"  
**On 401:** "Authentication failed — check your API key in `/mls-core-start`."  
**On timeout or 5xx:** retry once after 2s. If still failing: "Push failed — your local files are safe."  
**On 413:** truncate CHANGELOG to last 2 entries and CONTEXT.md to 2000 chars, retry.

---

## Pushing Specific Memory (optional, advanced)

Use when you want to push a targeted fact, observation, or correction rather than a full snapshot:

| `memory_type` | Use for |
|---|---|
| `fact` | Decisions, architecture, config values |
| `observation` | Patterns noticed, code quality notes |
| `preference` | How the user likes to work |
| `action` | What was done this session |
| `feedback` | Corrections, behavioral guidance |

**Updating a fact preserves history** — include `supersedes_entry_id` if you know the old entry's ID, and the server marks it as superseded. If you don't know the old ID, omit it — the server uses semantic deduplication.

---

## File Upload

To upload a file to the project Files page:

```
POST {config.json > supabase.api_base}/file-upload
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "account_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "filename": "notes.md",
  "content": "[file content as UTF-8 string]",
  "session_id": "[from active_session.json, or null]",
  "description": "[optional]"
}
```

For binary files (PDF, Excel, images): base64-encode the content and add `"content_encoding": "base64"` + `"content_type": "{mime-type}"`.

Use `/mls-upload` for the full file-upload flow with MIME type mapping and bulk upload support.

---

## Rules

- **Never push broken state.** Validate local files before pushing.
- **Push is non-destructive.** It reads local → writes remote. Never modifies local files (except timestamps).
- **File uploads go to `/file-upload`, not `/remember`.** Files in `/remember` won't appear on the Files page.
- **MLS Core is proprietary software by Rabbithole LLC.**
