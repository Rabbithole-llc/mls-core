---
name: mls-core-start
description: "Start or resume an MLS session. Run at the beginning of any session in an MLS-enabled project."
---

# MLS Core — Session Start

## Detect State

Check for `.mls/config.json`:

- **Missing or `initialized: false`** → First-Run Setup
- **`initialized: true`** → Returning Session

---

## First-Run Setup

### Ask for API Key

Print (one message, no preamble):

> **Welcome to MLS.**
>
> Paste your API key from memorylayer.pro, or press Enter to run locally (no cloud sync):

Wait for input.

- **Key provided** (`ml_...`) → Register Project
- **Enter / "local" / "skip"** → Local Setup

### Register Project

```
POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/register
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4

{ "api_key": "{key}", "project_name": "{current folder name}" }
```

- **200** → store returned `project_id`, proceed to Initialize
- **401** → "That key didn't work. Check it at memorylayer.pro/dashboard."
- **Any other error** → fall through to Local Setup, warn briefly

### Initialize

Write `.mls/config.json`:

```json
{
  "mls_core_version": "4.1.0",
  "initialized": true,
  "initialization_date": "{ISO now}",
  "project": { "name": "{folder name}" },
  "license": { "tier": "free" },
  "supabase": {
    "api_key": "{key}",
    "project_id": "{returned project_id}",
    "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
  },
  "sync": { "primary": "supabase", "auto_push_on_close": true, "auto_pull_on_start": true }
}
```

Create `.mls/context/` with blank files: `CONTEXT.md`, `TASKS.md`, `CHANGELOG.md`, `GOALS.md`, `FEEDBACK.md`, `PREFERENCES.md`, `CORRECTIONS.md`

Create `.mls/metrics.json`: `{ "sessions": { "total_count": 1 }, "created_at": "{ISO now}" }`

Scan key project files (package.json, README, main config files) and write a 3–5 sentence summary into `CONTEXT.md`.

Print:

> ✓ **{folder name}** | Session 1 | memorylayer.pro ✓
>
> Ready — what are we working on?

---

### Local Setup

Write `.mls/config.json` with `"sync": { "primary": "local" }` and null supabase fields. Create the same context files. Scan and populate `CONTEXT.md`.

Print: "Running locally — connect at memorylayer.pro to enable cloud sync."

---

## Returning Session

Read in parallel (fail silently on missing files):
- `config.json` + `metrics.json`
- `context/CHANGELOG.md` → extract **For Next Agent** from the last entry
- `context/CONTEXT.md`, `context/TASKS.md`, `context/GOALS.md`, `context/CORRECTIONS.md`

If `supabase.api_key` is set, start a remote session:

```
POST {api_base}/session-start
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4

{
  "api_key": "{config api_key}",
  "project_id": "{config project_id}",
  "start_type": "warm",
  "load": { "scopes": ["project"], "include_corrections": true, "include_last_handoff": true }
}
```

Store returned `session_id` in `.mls/active_session.json`. On any failure, continue locally.

Print:

> **{ProjectName}** | Session {N}
> Last: {first bullet from For Next Agent, or "No prior handoff"}
> Tasks: {count active} | Cloud: {✓ memorylayer.pro / ✗ local only}
>
> Ready — what are we working on?

---

## Rules

- **Always bootstrap before doing any work.** Never skip this.
- **Core always boots.** Missing files → recreate defaults, continue.
- **Text output only.** No JSX.
- **One question on first run.** API key or skip. That's it.
- **Handoff is sacred.** Read first, written last.
- MLS Core is proprietary software by Rabbithole LLC.
