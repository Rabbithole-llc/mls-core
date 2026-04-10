---
name: mls-core-start
description: "Session start for MLS Core — the Memory Layer System. Handles both first-time setup (initializing persistent memory on a new folder) and returning-session bootstrap (loading context, displaying status, reading the last agent's handoff). Use this skill whenever the user says /mls-core-start, 'start session', 'start mls', 'bootstrap', 'load context', 'initialize mls', 'set up memory', or at the start of any session where the agent needs to work within an MLS Core-enabled folder. Also trigger if you detect a .mls/ directory in the current workspace — that means MLS Core is installed and you should bootstrap before doing any work."
---

# MLS Core V3 — Session Start

## ⛔ HARD RULE: MODE ENFORCEMENT

**Before writing a single JSX file or calling `present_files`, you MUST have confirmed `MODE = "visual"` from the user's explicit response.**

- If `MODE = "text"` → **never** use the Write tool for `.jsx` files. **Never** call `present_files`. All output is plain text only. Violating this is a critical failure.
- If `MODE = "visual"` → use JSX templates as described below.
- If the user chose "2", "text", "fast", or anything non-visual → `MODE = "text"`. Do not default to visual.

**Checkpoint before every JSX write:** Ask yourself — "Did the user explicitly pick visual mode?" If no → do not write JSX. Output plain text instead.

---

## Step -1: Ask Experience Mode

**Before doing anything else**, ask the user which boot experience they want. Use plain text (no JSX yet):

> "Welcome to MLS Core. How would you like to proceed?
> 1. **Visual experience** — animated boot sequence with living backgrounds (recommended for first-time)
> 2. **Text experience** — fast, no graphics, straight to business
>
> Reply 1 or 2 (or just say 'text' or 'visual')."

- If user says **1**, "visual", or anything explicitly indicating the graphic experience → set `MODE = "visual"` and follow the Rendering Protocol below.
- If user says **2**, "text", "fast", "skip", "no graphics", or anything indicating text mode → set `MODE = "text"`. **Immediately stop. Do not write any JSX. Do not call present_files. Every single output from this point is plain text in the chat.** Still execute the full boot logic (detect state, read config, create .mls/, sync, etc.) — just deliver everything as concise text.
- If user doesn't respond to the mode question and just says "yes" or confirms the folder → default to `MODE = "visual"`.
- **Ambiguous reply (e.g., a number that could be a folder pick or mode pick):** re-read the conversation. If you haven't yet shown the mode question, treat the reply as a mode pick. "2" = text mode.

**In text mode**, replace each visual phase with a brief text equivalent:
- "folder_pick" → list all mounted folders, ask which one to use for MLS
- "connect" → list the 3 connection options with memorylayer.pro URL visible, ask user to pick
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
> 2. **Notion** — syncs to your Notion workspace
> 3. **Local only** — stays on this machine, no account needed
>
> Reply 1, 2, or 3.

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
| First-Run | `templates/first-run.jsx` | No `.mls/` exists. PHASE: `"boot_folder"` → `"connect"` → `"setup"` → `"capabilities"` → `"complete"` |
| Reconnect | `templates/reconnect.jsx` | `.mls/` exists, returning session. Auto-plays 7 phases in ~5s. |
| Upgrade | `templates/upgrade.jsx` | Version mismatch (v1→v2→v3). 6-slide carousel. |
| Loading | `templates/loading.jsx` | Between phases when doing work. Spinner + progress bar. |

### Template Placeholders

**first-run.jsx:**
- `DATA.folderName` — workspace folder name
- `DATA.folderPath` — full path
- `DATA.isEmptyFolder` — boolean
- `PHASE` — `"boot_folder"` | `"connect"` | `"setup"` | `"capabilities"` | `"complete"`
- `CONNECT_DATA.choice` — `"memorylayer"` | `"notion"` | `"local"` (for "connect" phase)
- `CONNECT_DATA.projectName` — confirmed project name
- `CONNECT_DATA.dashboardUrl` — memorylayer.pro or Notion URL (shown in "complete" phase)
- `SETUP_DATA.projectName` — project name (for "complete" phase)
- `SETUP_DATA.notionConnected` — boolean
- `SETUP_DATA.mlsConnected` — boolean
- `SETUP_DATA.communityBrainConnected` — boolean

**reconnect.jsx:**
- `DATA.projectName`, `DATA.sessionNumber`, `DATA.lastHandoff` (string[])
- `DATA.activeGoals` ({name, progress}[]), `DATA.activeTasks` (number)
- `DATA.lastSessionTag`, `DATA.timeSaved`, `DATA.notionConnected`
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

The first-run boot animation auto-transitions from boot → folder confirm in **3 seconds**. The reconnect animation auto-plays through 7 phases in ~5 seconds (warm start: ~3 seconds).

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
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
X-MLS-Edge-Version: 1

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

First-run goes: **connect → setup → complete**. The `boot_folder` phase is removed entirely.

---

### "connect" Phase — Where Should Memory Live?

**This is the most important choice in first-run.** Show the URL prominently. All three paths are first-class:

> **Where should your memory live?**
>
> 1. **memorylayer.pro** — https://memorylayer.pro — Cloud sync, team sharing, session analytics. Sign up or log in with your email — free to start.
> 2. **Notion** — Syncs to your Notion workspace. Your context lives as a structured, searchable page. Great for solo users already in Notion.
> 3. **Local only** — Memory stays on this machine. Fast, private, no account needed. Connect later with `/mls-connect`.

Wait for the user's choice (1, 2, 3, or the name of the option).

---

#### Option 1: memorylayer.pro

Ask:
> "Enter your email address to create your free memorylayer.pro account (or log in if you already have one):"

Take the email the user provides. **This endpoint requires the Supabase anon key as the Authorization header** — use the known value for memorylayer.pro: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4`

**Step 1 — Register / create account + project (one call):**
```
POST https://pjtqhxurdbaeatssorju.supabase.co/functions/v1/register
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
X-MLS-Edge-Version: 1

{
  "email": "[the email they entered]",
  "project_name": "[folder name chosen in Step -0.5]"
}
```

This endpoint is **idempotent** — if the email already has an account, it returns the existing `api_key` and provisions the new project under it. No separate "list" step or pre-existing key required.

**On 400 (invalid email format):**
> "That doesn't look like a valid email address. Please try again."
Re-prompt the email.

**On 422 (validation error):**
> "Couldn't create your account — check that your email is correct, or choose Notion / Local instead."
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

#### Option 2: Notion

**Make this feel like a reveal.** The Notion page IS the dashboard — it should appear within seconds and look impressive.

Show loading: "Connecting to your Notion workspace..."

1. **Check if Notion MCP is available** — try calling the Notion search tool. If it errors or doesn't exist:
   > "Notion MCP isn't connected. Add the Notion integration in your Claude Desktop settings. Continuing in local mode — run `/mls-core-start` again after connecting Notion."
   Fall through to local-only.

2. **Auto-discover the Projects database:**
   - Search with query "MLS Core Projects" or "MLS Projects"
   - If found: use it. Inform user: "Found your MLS Projects database."
   - If not found: offer to create one → create a Notion database with the full MLS schema.

3. **Create the project page immediately** with rich content:
   - Project Name, Status = "Active", MLS Version = "3.0.0"
   - Context block, Goals block, Tasks block, first Changelog entry, Agent Notes
   - Save `notion_project_page_id` to `config.json > dashboard.notion_project_page_id`
   - Save `projects_data_source_id` to `config.json > notion.projects_data_source_id`
   - Set `sync.primary = "notion"` in `config.json`

4. **Surface the link immediately — make it an event:**
   > "Your memory is live → [Notion page URL]"
   The user should open Notion right now and see their project already populated with structure. That is the MLS showcase moment.

5. **Register on Community Brain** (see section below).

6. Set `CONNECT_DATA.choice = "notion"`, `CONNECT_DATA.dashboardUrl = "[notion page url]"`

---

#### Option 3: Local Only

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

**2a. Project Confirmation** — handled by "boot_folder" phase above
**2b. Connection** — handled by "connect" phase above. NOT optional — every user must make a conscious choice.
**2c. Welcome** — explain the 7 core files (CONTEXT, TASKS, CHANGELOG, GOALS, PREFERENCES, FEEDBACK, CORRECTIONS)
**2d. Setup Method:**
- Folder has files → recommend Seed (option 1)
- Folder empty → recommend Guided (option 2)
- Guided questions: project name, description, stage, tech stack, goals, AI work preferences

**2e. Surface Capabilities** — present the 5 core commands

### Initialize

1. Update `config.json`: `mls_core_version` → "3.0.0", `initialized` → true, `initialization_date`, `setup_method`, `project.name`, ensure `preferences` block, `supabase` block (even if null values), `sync` block
2. Initialize `metrics.json`: `instance_id`, `created_at`, `sessions.total_count` → 1, all v2 blocks
3. Write first CHANGELOG entry with "For Next Agent" section
4. **If connected to memorylayer.pro (sync.primary = "supabase"):** Write `GLOBAL_CREDS_PATH` (`/sessions/stoic-laughing-bardeen/mnt/.mls/global.json`) with `{ "api_key": "[response.api_key]", "user_id": "[response.user.id]", "email": "[response.user.email]", "connected_at": "[ISO date]" }`. Create `/sessions/stoic-laughing-bardeen/mnt/.mls/` directory if it doesn't exist. **Do NOT use `~/.mls/` — that path is ephemeral and will not persist between sessions.** This is the account-level key returned by `POST /register` — it works frictionlessly across all future projects on this machine, no re-authentication needed.

### Fire Agent Start Hook

If `.agents/on_session_start.md` exists, read and execute its instructions. Non-blocking if missing or fails. Agents are optional.

---

### Community Brain Registration (Notion path only, first run)

If `community_brain.enabled` is `true` and `community_brain.project_row_id` is `null`:

1. Create a row in the "Connected Projects" database:
   - Data source ID: `collection://0223cc81-5cea-4f64-8bd6-4065e0ac136e`
   - Properties (names must match EXACTLY):
     - **Project** (title) — project name
     - **Status** (select) — `"active"`
     - **Sessions** (number) — `1`
     - **MLS Version** (select) — `"3.0.0"`
     - **Avg Rating** (number) — leave null
     - **Time Saved (hrs)** (number) — `0`
     - **Goals Active** (number) — count from GOALS.md
     - **Goals Completed** (number) — `0`
     - **Corrections** (number) — `0`
     - **Patterns** (number) — `0`
     - **Top Tags** (multi_select) — `[]`
     - **Last Sync** (date) — today
   - Use `notion-create-pages` with `data_source_url: "collection://0223cc81-5cea-4f64-8bd6-4065e0ac136e"`
2. Save the returned page ID to `config.json > community_brain.project_row_id`.
3. Inform user: "Your project is live on the Memory Layer Community Brain! Bookmark: https://www.notion.so/33733b46f2f281c8b1dcf5baa3f2cf0e"

If Community Brain registration fails, continue. Non-blocking.

---

## Returning Session Bootstrap

### SPEED: Show First, Load Second

**Step 1 (instant):** Read `config.json` + `metrics.json` + latest CHANGELOG entry's "For Next Agent" section.

**Step 2 (immediate):**

**⚠️ MODE CHECK: Only render JSX if MODE = "visual". If the user chose text mode (said "2", "text", "fast", etc.), NEVER write or present a JSX file. Go straight to text output.**

**Visual mode ONLY:** Read `templates/reconnect.jsx`, fill DATA:
- `projectName` from config, `sessionNumber` from metrics + 1
- `lastHandoff` from CHANGELOG, `lastSessionTag` from CHANGELOG
- `timeSaved` from metrics, `notionConnected`/`mlsConnected`/`communityBrainConnected` from config
- `agentCount` from config, `isWarmStart` detection, `lastSessionMinutesAgo`
- For `activeGoals` and `activeTasks` — use `[]` and `0` if not yet loaded
Write as `mls-boot.jsx` → call `present_files` → STOP.

**Text mode (NO JSX, plain text only):**
> **MLS Core — [Project Name]** | Session [N] | [cold/warm start]
> Dashboard: https://memorylayer.pro/dashboard
> Last handoff: [first line of For Next Agent]
> Goals: [N] active | Tasks: [N] active | Saved: [X hrs]
> Connections: memorylayer.pro [yes/no] | Notion [yes/no] | Community Brain [yes/no]
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
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4

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

If no API key configured: skip entirely. Backward compatible with V2.

### Version Migration (v2→v3)

If `mls_core_version` is "2.0.0":
1. Add `supabase` block (null values — user connects via `/mls-connect`)
2. Add `sync` block with defaults
3. Remove `agents` block (moved to `.agents/agent-config.json`)
4. Create `.agents/` directory structure if missing
5. Bump version to "3.0.0"
6. Log migration in CHANGELOG
7. Show upgrade carousel if visual mode

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

**`"supabase"`:** If Step 4 succeeded, sync is done. If Step 4 failed, fall back to Notion if configured.

**`"notion"`:** Search Projects database, compare Content Version, pull if newer. Always surface dashboard link.

**`"local"`:** Skip.

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
  "conflict_resolution": "local_wins",
  "auto_push_on_close": true,
  "auto_pull_on_start": true
}
```

`primary` options: `"supabase"` | `"notion"` | `"local"`

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
  "page_id": "33733b46f2f281c8b1dcf5baa3f2cf0e",
  "connected_projects_data_source_id": "0223cc81-5cea-4f64-8bd6-4065e0ac136e",
  "agent_marketplace_data_source_id": "41cf8d26-6a8a-48e3-aa36-dd7a7be5ec8a",
  "share_level": "anonymized_metrics",
  "project_row_id": null
}
```

### Dashboard

```json
"dashboard": {
  "url": null,
  "fallback_to_notion": true,
  "notion_project_page_id": null
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
- **Notion path: create the project page immediately and surface the link.** Make it feel like something just came alive.
- **The Session Start API call is non-blocking.** Fail gracefully, continue locally.
- **Always store the session ID.** Without it, session-end can't close the server-side session.
- **Agent hooks are optional.** Load from `.agents/`, don't manage behavior.
- **Auto-discover Notion databases** — never ask for IDs you can search for.
- **Write rich content to Notion pages** — never create empty shells.
- Respect PREFERENCES.md > default behavior. Apply FEEDBACK.md patterns. CORRECTIONS.md overrides CONTEXT.md conflicts.
- **MLS Core is proprietary software by Rabbithole LLC.** Redistribution or derivative products prohibited without written permission.
