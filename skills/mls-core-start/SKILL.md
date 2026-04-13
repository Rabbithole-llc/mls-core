---
name: mls-core-start
description: "Session start for MLS Core — the Memory Layer System. Handles both first-time setup (initializing persistent memory on a new folder) and returning-session bootstrap (loading context, displaying status, reading the last agent's handoff). Use this skill whenever the user says /mls-core-start, 'start session', 'start mls', 'bootstrap', 'load context', 'initialize mls', 'set up memory', or at the start of any session where the agent needs to work within an MLS Core-enabled folder. Also trigger if you detect a .mls/ directory in the current workspace — that means MLS Core is installed and you should bootstrap before doing any work."
---

# MLS Core V3.1.6 — Session Start

## ⛔ HARD RULE: MODE ENFORCEMENT

**`MODE = "text"` is the default. Do NOT ask the user to choose between visual and text mode.** Skip straight to the text mode flow unless the user explicitly requests visual mode (e.g., says "visual", "graphics", or "visual mode").

- **Never** write JSX files or call `present_files` unless the user has explicitly requested visual mode.
- All output is plain text only by default. Violating this is a critical failure.
- If the user explicitly says "visual", "visual mode", or "graphics" → set `MODE = "visual"` and follow the Rendering Protocol below.

**Checkpoint before every JSX write:** Ask yourself — "Did the user explicitly request visual mode?" If no → do not write JSX. Output plain text instead.

---

## Step -1: Mode (Text Default — No Question Asked)

**Do NOT ask the user which mode they want.** Always set `MODE = "text"` and proceed directly to folder selection. The visual mode rendering protocol still exists in this file if a user explicitly requests it, but it is never offered or prompted.

**In text mode**, replace each visual phase with a brief text equivalent:
- "folder_pick" → list all mounted folders, ask which one to use for MLS
- "connect" → list the 2 connection options with memorylayer.pro URL visible, ask user to pick
- "setup" → list the 3 setup options, ask user to pick
- "capabilities" → list the 5 commands
- "complete" → print checklist summary
- Reconnect → print project name, session number, last handoff, goals, tasks, connections status
- Loading → print "Working on: [step]..." for each step

---

## Step -0.5: Folder Selection (always runs before Step 0, in both modes)

**Detect all mounted workspace folders** by checking the file system. The user may have multiple folders open for reading context — MLS Core must initialize in ONE chosen project folder only.

**If only one folder is mounted:** Auto-select it. Skip the picker entirely. Proceed immediately to Step 0 with no user interaction needed.

**If multiple folders are mounted:** Show a picker using plain text (this happens before any JSX screen, in both modes):

> "You have [N] folders open. MLS Core sets up in ONE project folder — your other folders stay available as context.
>
> First-time setup: Which folder is your **active project**?
> 1. FolderA — [brief path hint]
> 2. FolderB — [brief path hint]
> 3. FolderC — [brief path hint]
>
> Reply with a number."

Once the user picks, set `WORKSPACE = [chosen folder path]`. All `.mls/` file operations use this path from here on. Never create `.mls/` in the other folders — they are context-only.

**Speed rule:** This step uses plain text only, even in visual mode. No JSX. One message, one reply, done.

---

## TEXT MODE Protocol (MODE = "text")

**If the user picked text mode, follow this section and skip the Rendering Protocol entirely.**

All output is plain chat text. No JSX files. No `present_files` calls. Run all the same logic (detect state, create files, call APIs) but surface everything as clean text messages.

### Text Mode Flow — First Run

After folder is selected, print one message per phase. Do NOT wait for "continue" between phases — deliver them as a single flowing conversation:

**Connect:**
> **MLS Core — [FolderName]** | First-time setup
>
> Where should your memory live?
> 1. **memorylayer.pro** — https://memorylayer.pro — cloud sync, team sharing, analytics
>    → No account? → https://memorylayer.pro/signup (free)
> 2. **Local only** — stays on this machine, no account needed
>
> Reply 1 or 2.

**After connect choice, execute connection logic silently, then print setup options:**
> Connected ✓ [or "Running local"] — now let's build your context.
>
> How should we start?
> 1. 🔍 **Seed from files** — scan this folder and auto-build context *(recommended — folder has files)*
> 2. 💬 **Guided setup** — answer 5–6 questions
> 3. ⚡ **Skip** — start minimal, build context as you work
>
> Reply 1, 2, or 3.

**After setup, print summary and toolkit — no user input needed:**
> ✓ Project memory initialized
> ✓ 7 context files created
> ✓ Context seeded from project files
> ✓ Cloud sync active — https://memorylayer.pro/dashboard
> ✓ Session 1 live
>
> **Your toolkit:** `/mls-core-start` · `/mls-core-stop` · `/mls-push` · `/mls-pull` · `/mls-test` · `/mls-agents`
> Dashboard: https://memorylayer.pro/dashboard
>
> Ready. Say `/mls-core-stop` when done to save your session.

### Text Mode Flow — Returning Session

Print a single compact status block, then stop:
> **[ProjectName]** | Session [N] | [warm/cold start]
> Last handoff: [first bullet from For Next Agent]
> Goals: [N] active | Tasks: [N] active
> Cloud: ✓ memorylayer.pro connected
> Dashboard: https://memorylayer.pro/dashboard
>
> Ready — what are we working on?

---

## Rendering Protocol (Visual Mode Only)

This section applies ONLY when `MODE = "visual"`. Skip entirely for text mode — use the TEXT MODE Protocol above instead.

This skill communicates via animated React components. Every user-facing output follows this exact sequence:

1. **Read** the appropriate template from `templates/` (relative to this SKILL.md)
2. **Fill** the DATA/PHASE placeholders with real values
3. **Write** the populated JSX as `mls-boot.jsx` to the workspace folder
4. **Call `mcp__cowork__present_files`** with the file path
5. **STOP** — say nothing. No text. Your turn is over.

Never skip step 4 (present_files) — without it the user sees a dead file link. Never add text after step 4 — the JSX IS the response. Never read a leftover `mls-boot.jsx` — always overwrite with fresh content.

### Templates

| Template | File | When to use |
|---|---|---|
| First-Run | `templates/first-run.jsx` | No `.mls/` exists. PHASE: `"connect"` → `"setup"` → `"capabilities"` → `"complete"` |
| Reconnect | `templates/reconnect.jsx` | `.mls/` exists, returning session. Auto-plays 7 phases in ~5s. |
| Upgrade | `templates/upgrade.jsx` | Version mismatch detected. 6-slide carousel. |
| Loading | `templates/loading.jsx` | Between phases when doing work. Spinner + progress bar. |

### Template Placeholders

**first-run.jsx:**
- `DATA.folderName` — workspace folder name
- `DATA.folderPath` — full path
- `DATA.isEmptyFolder` — boolean
- `PHASE` — `"connect"` | `"setup"` | `"capabilities"` | `"complete"`
- `CONNECT_DATA.choice` — `"memorylayer"` | `"local"` (for "connect" phase)
- `CONNECT_DATA.projectName` — confirmed project name
- `CONNECT_DATA.dashboardUrl` — memorylayer.pro URL (shown in "complete" phase)
- `SETUP_DATA.projectName` — project name (for "complete" phase)
- `SETUP_DATA.mlsConnected` — boolean
- `SETUP_DATA.communityBrainConnected` — boolean

**reconnect.jsx:**
- `DATA.projectName`, `DATA.sessionNumber`, `DATA.lastHandoff` (string[])
- `DATA.activeGoals` ({name, progress}[]), `DATA.activeTasks` (number)
- `DATA.lastSessionTag`, `DATA.timeSaved`
- `DATA.mlsConnected`, `DATA.communityBrainConnected`, `DATA.agentCount`
- `DATA.isWarmStart`, `DATA.lastSessionMinutesAgo`

**loading.jsx:**
- `LOADING_MESSAGE` — e.g., "Setting up your project"
- `LOADING_STEPS` — array of 2-4 step descriptions

### Between Phases

When doing work between visual stages:
1. Write loading template → present_files → STOP
2. Do internal work (create files, sync, etc.)
3. Write next phase template → present_files → STOP

Skip the loading screen if the transition is instant (no file creation needed).

### Animation Timing

The reconnect animation auto-plays through 7 phases in ~5 seconds (warm start: ~3 seconds).

### Fallback

If the Write tool fails, fall back to text-based communication.

---

## Step 0: Detect State

Check for `.mls/config.json` in the workspace folder.

- **No `.mls/`** → First-Run Setup
- **`.mls/config.json` exists, `initialized: false`** → First-Run Setup
- **`.mls/config.json` exists, `initialized: true`** → Returning Session Bootstrap

### Self-Heal

Before proceeding, validate `.mls/` structure if it exists. Missing/corrupted files → recreate from defaults, warn user:
- `config.json` missing/invalid → recreate from template, set `initialized: false`
- `context/` or any of 7 context files missing → recreate from template
- `metrics.json` missing/invalid → recreate with defaults, infer session count from CHANGELOG
- `modules/` missing → recreate with MODULE_TEMPLATE.md

**Principle: Core always boots.** No missing file should prevent bootstrap.

---

## API Constants

**Supabase anon key** — use as the `Authorization: Bearer` value for all edge function calls in this skill:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
```

---

## First-Run Setup

### Step 0.1: Global Credential Check

**⚠️ COWORK PATH RULE:** In the Cowork environment, `~` resolves to the **ephemeral** sandbox home (`/sessions/stoic-laughing-bardeen`), which is wiped between sessions. **Never use `~/.mls/` for persistent storage.** Instead, use the **mnt-level path** which maps to the user's real filesystem:

```
GLOBAL_CREDS_PATH = /sessions/stoic-laughing-bardeen/mnt/.mls/global.json
```

This persists at `[parent of your selected project folder]/.mls/global.json` on the user's actual machine.

**Before showing any connect screen**, check for a global config file at `GLOBAL_CREDS_PATH` (`/sessions/stoic-laughing-bardeen/mnt/.mls/global.json`).

```json
// /sessions/stoic-laughing-bardeen/mnt/.mls/global.json
{
  "api_key": "ml_...",
  "user_id": "uuid",
  "email": "user@example.com",
  "connected_at": "ISO date"
}
```

> Note: `api_key` is the account-level key returned by `POST /register`. It is stored once globally and reused across all projects. `user_id` is the UUID from the register response's `user.id` field.

**If `GLOBAL_CREDS_PATH` exists and contains a valid `api_key`:**

The user already has a memorylayer.pro account. Skip the full connect phase entirely. Use the stored key to call `POST /register` with just their email (idempotent — returns their existing account). Then let them pick or create a project.

**Re-validate and fetch projects (silently):**
```
POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/register
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}


{ "email": "[stored email from global.json]" }
```

On success: confirm the account is still valid. The response returns the existing `api_key`, `user.id`, and the full `hubs[]` array.

**Hub selection for returning users:**

```
if response.hubs.length === 1:
  → Auto-select response.hubs[0]. Store hub_id silently. No prompt.

if response.hubs.length > 1:
  → Show hub picker BEFORE the project prompt:
  "Found your memorylayer.pro account ([email]).
  Which hub should this project live under?
  [1] HubName1 (personal)
  [2] HubName2 (team)
  ...
  Reply with a number."
  → Store SELECTED_HUB = response.hubs[chosenIndex]

if response.hubs.length === 0:
  → Warn and fall through to local-only.
```

**Visual mode:** Skip the connect screen. Go straight to a short text prompt (no JSX yet):

> "Found your memorylayer.pro account ([email]).
>
> Options:
> 1. **New project** — create "[FolderName]" as a new project in [SELECTED_HUB.name]
> 2. **Skip** — run local only for now"

(If multiple hubs, show the hub picker above first, then this prompt.)

**Text mode:**
> "Found your memorylayer.pro account ([email]). Create new project "[FolderName]" under [SELECTED_HUB.name], or skip to run local?"

- **New / 1** → Call `POST /register` with stored email + folder name as `project_name` + `hub_id: SELECTED_HUB.id`. On success: store returned `project_id` and `hub_id` in config.json. Proceed to setup phase.
- **Rename before creating** → Ask project name, then call register.
- **Skip / 2** → Run local-only. Store nothing in `.mls/config.json`. User can connect later with `/mls-connect`.

On any error: fall through to local-only, warn user.

**Do not ask for an API key or email again.** Do not show the connect screen. The stored credentials are the account.

---

**If `GLOBAL_CREDS_PATH` does not exist** (`/sessions/stoic-laughing-bardeen/mnt/.mls/global.json`):

Proceed with the full connect flow below as normal.

---

### SPEED: Show First Screen FAST

The `boot_folder` phase is **eliminated**. The user already chose their folder in Step -0.5 — no need to ask again. Go straight to the connect phase.

After the user picks their mode (Step -1) and their folder (Step -0.5):

**Visual mode:** Deploy the `.mls/` file structure silently, then read `templates/first-run.jsx`, fill DATA with workspace folder name/path, set PHASE = `"connect"`, write as `mls-boot.jsx` → call `present_files` → STOP. No confirmation screen. No loading screen. The connect screen IS the first thing the user sees.

**Text mode:** Deploy `.mls/` silently, then print the connect options directly.

### Phase Flow

First-run goes: **connect → setup → complete**.

---

### "connect" Phase — Where Should Memory Live?

**This is the most important choice in first-run.** Show the URL prominently. Both paths are first-class:

> **Where should your memory live?**
>
> 1. **memorylayer.pro** — https://memorylayer.pro — Cloud sync, team sharing, session analytics. Sign up or log in with your email — free to start.
> 2. **Local only** — Memory stays on this machine. Fast, private, no account needed. Connect later with `/mls-connect`.

Wait for the user's choice (1, 2, or the name of the option).

---

#### Option 1: memorylayer.pro

Ask:
> "Enter your email address to create your free memorylayer.pro account (or log in if you already have one):"

After the user provides their email, ask for a password:
> "Choose a password for your account (minimum 8 characters):"

**Password rules:**
- Minimum 8 characters. If the user enters fewer than 8, re-prompt: "Password must be at least 8 characters. Please try again."
- Do not echo or display the password back to the user after they enter it.
- If this is a returning user (email already has an account), the password is used to authenticate. If it doesn't match, the backend will return an error — re-prompt with: "Incorrect password. Please try again, or enter a different email."

Take the email and password the user provides. **This endpoint requires the Supabase anon key as the Authorization header** — use `{SUPABASE_ANON_KEY}` (defined in the API Constants section above).

**Step 1 — Register / create account + project (one call):**
```
POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/register
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}


{
  "email": "[the email they entered]",
  "password": "[the password they entered]",
  "project_name": "[folder name chosen in Step -0.5]"
}
```

This endpoint is **idempotent** — if the email already has an account, it authenticates with the password and provisions the new project under it. No separate "list" step or pre-existing key required.

**On 400 (invalid email format):**
> "That doesn't look like a valid email address. Please try again."
Re-prompt the email.

**On 401 (incorrect password):**
> "Incorrect password. Please try again, or enter a different email."
Re-prompt the password (do not re-ask for email unless the user wants to change it).

**On 422 (validation error):**
> "Couldn't create your account — check that your email is correct, or choose Local instead."
Re-prompt or let them pick a different option.

**On success (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "username"
  },
  "api_key": "ml_...",
  "hubs": [
    {
      "id": "uuid",
      "name": "My Hub",
      "slug": "hub-slug",
      "type": "personal"
    }
  ],
  "project": {
    "id": "uuid",
    "name": "project-name",
    "tier": "free"
  }
}
```

**Hub selection — run this before storing anything:**

```
SELECTED_HUB = null

if response.hubs.length === 0:
  → No hub available — store hub_id as null, warn: "No hub found for your account. Contact support at memorylayer.pro."

if response.hubs.length === 1:
  → Auto-select response.hubs[0]. No prompt needed.
  SELECTED_HUB = response.hubs[0]

if response.hubs.length > 1:
  → Show hub picker (plain text, both modes):
  "Your account has multiple hubs — which one should this project live under?
  [1] HubName1 (personal) — hub-slug-1
  [2] HubName2 (team) — hub-slug-2
  ...
  Reply with a number."
  → Wait for reply. Set SELECTED_HUB = response.hubs[chosenIndex].
```

**Store in `GLOBAL_CREDS_PATH`** (`/sessions/stoic-laughing-bardeen/mnt/.mls/global.json`):
```json
{
  "api_key": "[response.api_key]",
  "user_id": "[response.user.id]",
  "email": "[response.user.email]",
  "connected_at": "[ISO date now]"
}
```

**Store in `config.json`**:
```json
"supabase": {
  "api_key": "[response.api_key]",
  "project_id": "[response.project.id]",
  "hub_id": "[SELECTED_HUB.id or null]",
  "hub_slug": "[SELECTED_HUB.slug or null]",
  "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
}
```

**Important:** The `api_key` (format: `ml_...`) is a single account-level key used for all operations. All other skill files (mls-core-stop, mls-push, mls-pull) read `supabase.api_key` from config.json — it will work correctly for session-start, session-end, remember, and hub-brain calls.

- Set `sync.primary = "supabase"` in `config.json`
- Set `license.tier = "[response.project.tier]"` in `config.json`
- Confirm: "Account created ✓ — your project is live at https://memorylayer.pro/dashboard"
- Set `CONNECT_DATA.choice = "memorylayer"`, `CONNECT_DATA.dashboardUrl = "https://memorylayer.pro/dashboard"`

**If server returns an existing account (email already registered):**
The response is identical — same shape, existing `api_key` returned. No special handling needed. Inform user: "Logged in to your existing account — project '[project_name]' created ✓"

**On any other error or network failure:**
> "Couldn't reach memorylayer.pro right now. Continuing in local mode — connect later with `/mls-connect`."
Fall through to local-only. Do not block.

---

#### Option 2: Local Only

Store in `config.json`:
```json
"sync": { "primary": "local", "auto_push_on_close": false, "auto_pull_on_start": false }
```

Inform user:
> "Running in local mode. Your memory lives in `.mls/` in this folder. Run `/mls-connect` anytime to add cloud sync."

Set `CONNECT_DATA.choice = "local"`.

---

**After any connection choice is handled:**
Write loading template ("Building your project context", steps: ["Gathering project info", "Setting up guided questions", "Preparing context files"]) → present_files → STOP → Proceed to "setup" phase.

---

**"setup"** — User chooses setup method (1=Seed from files, 2=Guided setup, 3=Skip)
- Execute chosen method, build initial context
- Write PHASE="capabilities" → present_files → STOP

**"capabilities"** — Shows 5 commands toolkit (mls-core-start, mls-core-stop, mls-push, mls-pull, mls-test)
- User acknowledges → Write PHASE="complete" → present_files → STOP

**"complete"** — Shows setup checklist with animated checkmarks. Include the dashboard link if connected.

---

### Deploy the Template

Create `.mls/` directory structure:

```
[workspace]/.mls/
  core.md
  config.json
  metrics.json
  onboarding.md
  session-close.md
  context/
    CONTEXT.md, TASKS.md, CHANGELOG.md, GOALS.md,
    FEEDBACK.md, PREFERENCES.md, CORRECTIONS.md
  modules/
    MODULE_TEMPLATE.md
```

Resolution order: existing file with content → .template.md copy → config-template-v2.json → built-in defaults.

### Onboarding Protocol

**Skip logic:** If `initialized: true` AND context files have content AND `sessions.total` > 0 → skip to Returning Session Bootstrap. If user says "skip"/"let's go" → respect immediately.

**2b. Connection** — handled by "connect" phase above. NOT optional — every user must make a conscious choice.
**2c. Welcome** — explain the 7 core files (CONTEXT, TASKS, CHANGELOG, GOALS, PREFERENCES, FEEDBACK, CORRECTIONS)
**2d. Setup Method:**
- Folder has files → recommend Seed (option 1)
- Folder empty → recommend Guided (option 2)
- Guided questions: project name, description, stage, tech stack, goals, AI work preferences

**2e. Surface Capabilities** — present the 5 core commands

### Initialize

1. Update `config.json`: `mls_core_version` → "3.1.6", `initialized` → true, `initialization_date`, `setup_method`, `project.name`, ensure `preferences` block, `supabase` block (even if null values), `sync` block
2. Initialize `metrics.json`: `instance_id`, `created_at`, `sessions.total_count` → 1, all v2 blocks
3. Write first CHANGELOG entry with "For Next Agent" section
4. **If connected to memorylayer.pro (sync.primary = "supabase"):** Write `GLOBAL_CREDS_PATH` (`/sessions/stoic-laughing-bardeen/mnt/.mls/global.json`) with `{ "api_key": "[response.api_key]", "user_id": "[response.user.id]", "email": "[response.user.email]", "connected_at": "[ISO date]" }`. Create `/sessions/stoic-laughing-bardeen/mnt/.mls/` directory if it doesn't exist. **Do NOT use `~/.mls/` — that path is ephemeral and will not persist between sessions.** This is the account-level key returned by `POST /register` — it works frictionlessly across all future projects on this machine, no re-authentication needed.

### Fire Agent Start Hook

If `.agents/on_session_start.md` exists, read and execute its instructions. Non-blocking if missing or fails. Agents are optional.

---

## Returning Session Bootstrap

### SPEED: Show First, Load Second

**Step 1 (instant):** Read `config.json` + `metrics.json` + latest CHANGELOG entry's "For Next Agent" section.

**Step 2 (immediate):**

**⚠️ MODE CHECK: Only render JSX if MODE = "visual". If the user chose text mode (said "2", "text", "fast", etc.), NEVER write or present a JSX file. Go straight to text output.**

**Visual mode ONLY:** Read `templates/reconnect.jsx`, fill DATA:
- `projectName` from config, `sessionNumber` from metrics + 1
- `lastHandoff` from CHANGELOG, `lastSessionTag` from CHANGELOG
- `timeSaved` from metrics, `mlsConnected`/`communityBrainConnected` from config
- `agentCount` from config, `isWarmStart` detection, `lastSessionMinutesAgo`
- For `activeGoals` and `activeTasks` — use `[]` and `0` if not yet loaded
Write as `mls-boot.jsx` → call `present_files` → STOP.

**Text mode (NO JSX, plain text only):**
> **MLS Core — [Project Name]** | Session [N] | [cold/warm start]
> Dashboard: https://memorylayer.pro/dashboard
> Last handoff: [first line of For Next Agent]
> Goals: [N] active | Tasks: [N] active | Saved: [X hrs]
> Connections: memorylayer.pro [yes/no] | Community Brain [yes/no]
> Loading context...

In text mode, immediately proceed to Step 3 after printing this summary — do not wait for user input.

**Step 3 (background):** While animation plays, read all context files:
1. CHANGELOG.md → full latest handoff
2. CONTEXT.md → project knowledge
3. TASKS.md → current tasks
4. GOALS.md → active goals
5. FEEDBACK.md → behavioral patterns
6. PREFERENCES.md → user preferences
7. CORRECTIONS.md → active corrections (override CONTEXT.md conflicts)

### Step 4: Call Session Start API

Check `config.json > supabase.api_key`. If it exists and is not null:

```
POST {config.json > supabase.api_base}/session-start
Content-Type: application/json
Authorization: Bearer {SUPABASE_ANON_KEY}


{
  "api_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "start_type": "{warm|cold}",
  "load": {
    "scopes": ["project", "agent_portable", "agent_project"],
    "include_corrections": true,
    "include_last_handoff": true
  }
}
```

On success: store session ID in `.mls/active_session.json` as `{"session_id": "uuid", "started_at": "ISO"}`. Merge corrections and remote handoff with local context.

On error: log it, write `{"session_id": null, "local_only": true, "error": "..."}`, continue in local-only mode.

If no API key configured: skip entirely. Local-only mode.

### Warm Start Detection

```
if warm_start_enabled AND (now - last_session.ended_at) < threshold_minutes AND same_user → WARM START
```

Warm start: animation plays faster (0.6x speed). After: "Pick up where we left off, or starting something new?"

### Context Pruning (every N sessions)

If `sessions.total_count % context_pruning_interval === 0`: scan for stale items, present findings → user decides.

### Fire Agent Start Hook

If `.agents/on_session_start.md` exists, read and execute. Non-blocking if missing or fails.

### Remote Sync

Determine from `config.json > sync.primary`:

**`"supabase"`:** If Step 4 succeeded, sync is done. On failure, fall through to local-only and warn user.

**`"local"`:** Skip.

### Step 4.6: Achievement Check

After the session bootstrap (context loaded, status displayed), run a lightweight achievement diff — silently if no new achievements, inline notification if any newly unlocked.

**Data Model:** Each `Achievement` object has:
- `slug` — string identifier (e.g. `"streak-7"`)
- `name` — display name
- `description` — short description
- `icon` — Lucide icon name: `zap`, `calendar`, `clock`, `brain`, `target`, `refresh`, `cpu`, `layers`, `folder`, or `users`
- `unlocked_at` — ISO timestamp (present on unlocked achievements only)
- `progress` — number 0–100 (present on in-progress achievements only)

**Category map (slug → category):**
- Sessions: `first-contact`, `streak-3`, `streak-7`, `streak-30`, `warm-starter`
- Memory: `memory-keeper`, `goal-crusher`, `correction-loop`, `time-saver`, `century-club`
- Agents: `agent-activated`, `agent-loop`, `multi-agent`, `agent-veteran`
- Projects & Hubs: `founder`, `multi-project`, `team-player`
- Community: `brain-sharer`

**1. Read the local cache:**
Check for `.mls/achievements.json`. If it doesn't exist, create it now with defaults:
```json
{
  "last_checked": "[ISO timestamp now]",
  "unlocked": [],
  "in_progress": [],
  "locked": []
}
```

**2. Call the achievements endpoint (non-blocking):**
```
GET {config.json > supabase.api_base}/achievements
X-MLS-Key: {config.json > supabase.account_key ?? config.json > supabase.api_key}
X-MLS-Edge-Version: 1
```

Response shape:
```json
{
  "unlocked":     [ { "slug": "...", "name": "...", "description": "...", "icon": "...", "unlocked_at": "ISO" } ],
  "in_progress":  [ { "slug": "...", "name": "...", "description": "...", "icon": "...", "progress": 42 } ],
  "locked":       [ { "slug": "...", "name": "...", "description": "...", "icon": "..." } ]
}
```

If both `account_key` and `api_key` are null, or the call fails for any reason → skip silently and continue. Never block session start.

`account_key` takes precedence over `api_key` for the `X-MLS-Key` header. Fall back to `api_key` if `account_key` is null.

**3. Diff against cache:**
Compare `response.unlocked[].slug` against `.mls/achievements.json > unlocked[].slug`.

- If there are **new achievements** (slugs in response but not in cache) → display for each:
  > 🏆 Achievement unlocked: **[Name]** — [Description]

  After listing all new achievements, append:
  > View all achievements → /dashboard/achievements

- If **no new achievements** → skip silently. Do not print anything.

**4. Update the cache:**
Write the full response arrays back to `.mls/achievements.json`:
```json
{
  "last_checked": "[ISO timestamp now]",
  "unlocked":    [...full unlocked array from response...],
  "in_progress": [...full in_progress array from response...],
  "locked":      [...full locked array from response...]
}
```

**5. Surface recent achievements in the session status block:**
After displaying the standard text-mode session status, if `response.unlocked.length > 0`, append one compact line showing up to 3 most recently unlocked achievements (sorted by `unlocked_at` descending):
> 🏆 [Name1] · [Name2] · [Name3]  →  /dashboard/achievements

Only show this line when there are unlocked achievements. Omit entirely if the array is empty.

**Rules:**
- Entirely non-blocking. Any failure (missing cache, API error, parse error) → skip silently, continue.
- Do not display the achievement check in progress. Only surface the result if there's something new.
- If the API call fails, do NOT clear the cache — preserve the last known state.

---

### Step 4.7: Achievements Page (`/dashboard/achievements`)

When the user says "show achievements", "view achievements", "open /dashboard/achievements", or navigates to that route:

**1. Load data:**
Read `.mls/achievements.json`. If the cache is missing or `last_checked` is more than 5 minutes ago, re-call the achievements endpoint (same headers as Step 4.6, Step 2) and update the cache before proceeding.

**2. Build the template:**
Read `templates/achievements.jsx` from this skill's templates directory. Fill in `ACHIEVEMENTS_DATA` with the full cached response:
```js
const ACHIEVEMENTS_DATA = {
  unlocked:    [...],  // Achievement[] sorted by unlocked_at descending
  in_progress: [...],  // Achievement[] sorted by progress descending
  locked:      [...],  // Achievement[]
};
```

**3. Write and present:**
Write the populated component as `mls-achievements.jsx` to the workspace folder, then call `present_files` with that path.

**Rules:**
- Only run when explicitly requested — not automatically during bootstrap.
- If `achievements.json` is empty (no data yet), render the page with empty arrays so the user sees the full category structure with all achievements locked.

---

### Finalize

Increment `sessions.total_count`, record `started_at`. Bootstrap complete — ready for work.

---

## Configuration Reference

### Supabase (memorylayer.pro)

```json
"supabase": {
  "api_key": "ml_...",
  "project_id": "uuid",
  "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
}
```

> `api_key` is the account-level key returned by `POST /register` (format: `ml_...`). A single key works for all projects — there is no per-project key. The `project_id` scopes all memory operations (sessions, entries, pushes, pulls) to the correct project.

### Sync

```json
"sync": {
  "primary": "supabase",
  "conflict_resolution": "ask_user",
  "auto_push_on_close": true,
  "auto_pull_on_start": true
}
```

`primary` options: `"supabase"` | `"local"`

### Preferences

```json
"preferences": {
  "status_display_on_start": true,
  "auto_context_update_on_close": true,
  "changelog_max_entries": 30,
  "context_pruning_interval": 30,
  "warm_start_enabled": true,
  "warm_start_threshold_minutes": 120,
  "feedback": {
    "enabled": true,
    "prompt_at_close": true,
    "collect_agent_self_assessment": true,
    "pattern_threshold": 3
  }
}
```

### Community Brain

```json
"community_brain": {
  "enabled": true,
  "share_level": "anonymized_metrics"
}
```

### Dashboard

```json
"dashboard": {
  "url": "https://memorylayer.pro/dashboard"
}
```

## Full Config.json v3.1.6 Schema

```json
{
  "mls_core_version": "3.1.6",
  "initialized": true,
  "initialization_date": "2026-04-10",
  "setup_method": "seed_from_files",
  "project": {
    "name": "...",
    "description": "...",
    "stage": "active_development",
    "tech_stack": ["..."]
  },
  "license": { "tier": "free" },
  "preferences": {
    "status_display_on_start": true,
    "auto_context_update_on_close": true,
    "changelog_max_entries": 30,
    "context_pruning_interval": 30,
    "warm_start_enabled": true,
    "warm_start_threshold_minutes": 120,
    "feedback": {
      "enabled": true,
      "prompt_at_close": true,
      "collect_agent_self_assessment": true,
      "pattern_threshold": 3
    }
  },
  "supabase": {
    "api_key": null,
    "account_key": null,
    "project_id": null,
    "api_base": "https://pjtqhxurdbaeatssorju.supabase.co/functions/v1"
  },
  "community_brain": {
    "enabled": true,
    "share_level": "anonymized_metrics"
  },
  "agents": {
    "enabled": true,
    "max_concurrent": 3,
    "require_approval_for_autonomous": true,
    "trigger_dispatch_version": "1.0.0",
    "installed_modules": []
  },
  "dashboard": {
    "url": "https://memorylayer.pro/dashboard"
  },
  "sync": {
    "primary": "supabase",
    "conflict_resolution": "ask_user"
  }
}
```

## Metrics Schema (v2+)

`sessions.warm_starts`, `feedback` (total_collected, ratings, avg_satisfaction, patterns_identified), `session_tags` (strategy, build, debug, review, planning, research, design, admin, mixed), `corrections` (total_logged, active, resolved), `goals` (total_created, active, completed, parked).

## Tag Inference Rules

APIs/backends → `backend`, React/UI → `frontend`, CI/CD/Docker → `devops`, ML/AI/agents → `ai-agents`, databases/analytics → `data`, docs → `documentation`, user research → `research`, ads/content/social → `marketing`, styling/UX → `design`, cloud/AWS → `infrastructure`.

## Important Rules

- Never start work before bootstrap is complete
- The "For Next Agent" handoff is sacred — always read first, always write at close
- Files outside `.mls/` belong to the user — don't touch unless asked
- Core always boots — self-heal and continue through any failure
- **The "connect" phase is mandatory on first run.** Never skip it. Every user must consciously choose where memory lives.
- **memorylayer.pro path: always call `POST /register`.** Without it, the account and project are never provisioned. The returned `api_key` authenticates all future calls; the `project.id` scopes all memory. Both must be stored — `api_key` in `config.json > supabase.api_key` and in `global.json`; `project.id` in `config.json > supabase.project_id`. No pre-existing API key is required — email is the only input needed.
- **The Session Start API call is non-blocking.** Fail gracefully, continue locally.
- **Always store the session ID.** Without it, session-end can't close the server-side session.
- **Agent hooks are optional.** Load from `.agents/`, don't manage behavior.
- Respect PREFERENCES.md > default behavior. Apply FEEDBACK.md patterns. CORRECTIONS.md overrides CONTEXT.md conflicts.
- **MLS Core is proprietary software by Rabbithole LLC.** Redistribution or derivative products prohibited without written permission.
