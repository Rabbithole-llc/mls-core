---
name: mls-push
description: "Save context to the cloud mid-session. Run /mls-push anytime to sync work to memorylayer.pro."
---

# MLS Core — Push

Save local context to memorylayer.pro. Works mid-session — no need to close first.

**To push a file**, say "push [filename]" or run `/mls-upload`.

---

## Step 1: Validate

Check `.mls/config.json`:
- Missing or `initialized: false` → "Run `/mls-core-start` first."
- `sync.primary = "local"` or `supabase.api_key` is null → "Cloud sync not configured. Run `/mls-core-start` to connect."

**SUPABASE_ANON_KEY** (use as `Authorization: Bearer` for all calls):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

---

## Step 2: Read Local Files

Read in parallel (recreate from defaults if missing):
- `.mls/context/CONTEXT.md`
- `.mls/context/GOALS.md`
- `.mls/context/TASKS.md`
- `.mls/context/CHANGELOG.md` (last 5 entries only)
- `.mls/active_session.json` (for `session_id`, or use `null`)

---

## Step 3: Push

```
POST {config.json → supabase.api_base}/remember
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "api_key": "{config api_key}",
  "project_id": "{config project_id}",
  "entries": [{
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
  }]
}
```

- **200–201** → update `config.json → sync.last_push` to now. Print: "Pushed ✓ — memorylayer.pro/dashboard"
- **401** → "Authentication failed — check your API key."
- **Timeout / 5xx** → retry once after 2s. If still failing: "Push failed — your local files are safe."
- **413** → truncate CHANGELOG to last 2 entries and CONTEXT.md to 2000 chars, retry.

---

## Pushing a Specific Memory (advanced)

For targeted facts, decisions, or corrections rather than a full snapshot, use `memory_type`:
`fact` · `observation` · `preference` · `action` · `feedback`

Include `supersedes_entry_id` if updating an existing entry (omit if unknown — server deduplicates).

---

## Rules

- **Never push broken state.** Validate local files before pushing.
- **Push is non-destructive.** Reads local → writes remote. Never modifies local files (except timestamps).
- **File uploads go to `/file-upload`, not `/remember`.** Use `/mls-upload` for files.
- MLS Core is proprietary software by Rabbithole LLC.
