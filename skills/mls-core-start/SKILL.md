---
name: mls-core-start
description: "Start or resume an MLS session. Run /mls-core-start at the beginning of any session in an MLS-enabled folder, or when setting up MLS for the first time."
---

# MLS Core — Session Start

## Step 1: Detect State

Check for `.mls/config.json` in the current workspace folder.

- **File missing or `initialized: false`** → First-Run Setup (below)
- **`initialized: true`** → Returning Session Bootstrap (below)

---

## First-Run Setup

### Step 1: Ask for API Key

Print exactly this (one message, no preamble):

> **MLS Core — first-time setup**
>
> Paste your memorylayer.pro API key to get started, or press Enter to run locally (no cloud sync):
>
> Get a free key at https://memorylayer.pro

Wait for input.

- **User pastes a key** (`ml_...`) → continue to Step 2
- **User presses Enter / says "local" / "skip"** → jump to Local Setup

### Step 2: Create Project

Call the register endpoint using the provided key:

```
POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/register
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "api_key": "{the key the user pasted}",
  "project_name": "{current folder name}"
}
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

**On 200:** store the returned `project_id` in config.json (Step 3), proceed.  
**On 401:** "That API key didn't work. Check it at memorylayer.pro/dashboard and try again."  
**On any other error:** fall through to Local Setup and warn the user.

### Step 3: Write Config and Initialize Files

Create `.mls/` directory and write:

**`.mls/config.json`:**
```json
{
  "mls_core_version": "4.1.0",
  "initialized": true,
  "initialization_date": "{ISO date now}",
  "project": {
    "name": "{folder name}"
  },
  "license": { "tier": "free" },
  "supabase": {
    "api_key": "{user-provided key}",
    "project_id": "{returned project_id}",
    "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
  },
  "sync": {
    "primary": "supabase",
    "auto_push_on_close": true,
    "auto_pull_on_start": true
  }
}
```

Create context files (blank templates):

```
.mls/context/CONTEXT.md
.mls/context/TASKS.md
.mls/context/CHANGELOG.md
.mls/context/GOALS.md
.mls/context/FEEDBACK.md
.mls/context/PREFERENCES.md
.mls/context/CORRECTIONS.md
```

**`.mls/metrics.json`** — `{ "sessions": { "total_count": 1 }, "created_at": "{ISO now}" }`

### Step 4: Confirm and Offer Context Seed

Print:

> ✓ MLS Core ready — **{folder name}** | Session 1
> Cloud sync: memorylayer.pro ✓
>
> Want me to scan this folder and build your initial context? (yes / no)

- **Yes** → read key project files (package.json, README, main config files), write a 3–5 sentence summary into CONTEXT.md, list discovered tasks/goals if obvious
- **No** → skip; user can fill context in later

Say: "Ready — use `/mls-core-stop` when you're done to save your session."

---

### Local Setup (no API key)

Write `.mls/config.json` with `sync.primary: "local"` and null supabase fields. Create the same context file structure. No API calls.

Print: "Running locally. Connect later at memorylayer.pro to enable cloud sync."

---

## Returning Session Bootstrap

### Step 1: Quick Load

Read in parallel (fail silently on any missing file):
- `config.json` + `metrics.json`
- `context/CHANGELOG.md` → extract the **For Next Agent** section from the last entry
- `context/CONTEXT.md`, `context/TASKS.md`, `context/GOALS.md`
- `context/CORRECTIONS.md` (overrides CONTEXT.md on conflicts)

### Step 2: Start Remote Session (if connected)

If `config.json > supabase.api_key` is set:

```
POST {config.json > supabase.api_base}/session-start
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}

{
  "api_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "start_type": "warm",
  "load": {
    "scopes": ["project"],
    "include_corrections": true,
    "include_last_handoff": true
  }
}
```

On success: store `session_id` in `.mls/active_session.json`.  
On "Invalid api_key or project_id": shared project — continue locally, no error shown.  
On any other failure: continue locally, mention briefly that cloud sync is unavailable.

### Step 3: Show Status

Print a single compact block:

> **{ProjectName}** | Session {N}
> Last: {first bullet from For Next Agent, or "No prior handoff"}
> Tasks: {count active} | Goals: {count active}
> Cloud: {✓ memorylayer.pro / ✗ local only}
>
> Ready — what are we working on?

---

## Configuration Reference

**`config.json > supabase`:**
```json
{
  "api_key": "ml_...",
  "project_id": "uuid",
  "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
}
```

**Sync modes:** `"supabase"` (auto push/pull) | `"local"` (no remote calls)

---

## Rules

- **Always bootstrap before doing any work.** Never skip this.
- **Core always boots.** Missing files → recreate defaults, continue.
- **Text output only.** No JSX, no visual mode prompts.
- **One question on first run.** API key or skip. That's it.
- **Handoff is sacred.** For Next Agent = first thing read, last thing written.
- **MLS Core is proprietary software by Rabbithole LLC.**
