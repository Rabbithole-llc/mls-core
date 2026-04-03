---
name: mls-core-start
description: "Session start for MLS Core — the Memory Layer System. Handles both first-time setup (initializing persistent memory on a new folder) and returning-session bootstrap (loading context, displaying status, reading the last agent's handoff). Use this skill whenever the user says /mls-core-start, 'start session', 'start mls', 'bootstrap', 'load context', 'initialize mls', 'set up memory', or at the start of any session where the agent needs to work within an MLS Core-enabled folder. Also trigger if you detect a .mls/ directory in the current workspace — that means MLS Core is installed and you should bootstrap before doing any work."
---

# MLS Core — Session Start

You are running the MLS Core session bootstrap. This skill handles two scenarios:
1. **First run** — The folder doesn't have MLS Core yet (or it's uninitialized). You'll set it up.
2. **Returning session** — MLS Core is already initialized. You'll load context, display status, and get ready to work.

The goal is simple: make sure the agent has full, fresh context before doing any work. Persistent memory is what makes MLS Core valuable — every session builds on the last one.

---

## Step 0: Detect State

Check if `.mls/config.json` exists in the current working directory or the user's workspace folder.

- **If `.mls/` doesn't exist** → This is a brand new setup. Go to **First-Run Setup**.
- **If `.mls/config.json` exists but `initialized` is `false`** → Setup was started but not completed. Go to **First-Run Setup**.
- **If `.mls/config.json` exists and `initialized` is `true`** → This is a returning session. Go to **Returning Session Bootstrap**.

---

## First-Run Setup

This runs once per folder. It creates the `.mls/` directory structure, walks the user through setup, and initializes persistent memory.

### 1. Deploy the Template

Copy the MLS Core template files from this skill's assets directory into the user's workspace:

```
[workspace]/.mls/
  core.md
  config.json
  metrics.json
  onboarding.md
  session-close.md
  context/
    CONTEXT.md
    TASKS.md
    CHANGELOG.md
  modules/
    MODULE_TEMPLATE.md
```

The template files are in this skill's `assets/mls-template/` directory. Copy the entire structure to `[workspace]/.mls/`.

If the `.mls/` directory already exists (partial setup), only copy files that are missing — don't overwrite existing content.

### 2. Run the Onboarding Protocol

Read `.mls/onboarding.md` and follow it exactly. The key steps are:

**Welcome the user.** Explain MLS Core simply:
> "Welcome to MLS Core. I'm setting up persistent memory for this folder — from now on, every AI session here builds on the last one. I'll remember your project context, track what you're working on, and hand off notes between sessions so nothing gets lost."

**Explain the three core files** (1-2 sentences each):
- **CONTEXT.md** — Your project's brain. Knowledge about what you're working on, key decisions, who's involved.
- **TASKS.md** — Your living to-do list that persists between sessions.
- **CHANGELOG.md** — Session history with handoff notes so the next agent knows exactly where things stand.

**Offer setup options** (present in this order):

If the folder already has files in it, recommend option 1:
1. **[Recommended] Seed from existing files** — Scan the folder, read all readable files, and build initial context automatically. Files stay in place — the agent just learns from them.
2. **Guided setup** — Answer 4-5 questions to populate context manually.
3. **Skip** — Set up the structure and build context organically over time.

If the folder is empty, recommend option 2 (guided setup).

### 3. Initialize

After the user picks a setup option and context is built:

1. Update `config.json`:
   - `initialized` → `true`
   - `initialization_date` → current ISO timestamp
   - `setup_method` → `"seed"`, `"guided"`, or `"organic"`
   - `project.name` → from what was learned, or ask the user

2. Initialize `metrics.json`:
   - `instance_id` → generate a unique ID (timestamp + random suffix)
   - `created_at` → current ISO timestamp
   - `sessions.total_count` → `1`
   - `users.unique_users` → `["[current user name]"]`
   - `users.total_count` → `1`

3. Write the first CHANGELOG entry (at the top of the file):
   ```
   ## Session 1 — [YYYY-MM-DD]
   **User:** [name]
   **Summary:**
   - MLS Core v1.0 initialized on this folder
   - Setup method: [seed/guided/organic]
   - [Details about what was built]

   **For Next Agent:**
   - Fresh MLS Core instance — context is [rich/initial/minimal]
   - Project: [brief description]
   - [Immediate priorities if identified]
   - Continue building context from each session's work
   ```

4. Display the first status block (see Status Display below).

5. Ask what the user wants to work on. Session 1 has begun.

---

## Returning Session Bootstrap

This runs on every session after the first. Load context, display status, get ready to work.

### 1. Read Config

Read `.mls/config.json`. Note the version and license tier.

### 2. Validate License

- **Starter tier (default):** Works without a license key. Max 2 users. If the user count exceeds 2, show an upgrade notice but continue functioning.
- **Pro tier:** Requires a valid license key. If invalid, downgrade behavior to Starter and notify.
- If `config.json` is corrupted, operate in read-only mode and inform the user.

### 3. Identify User

If this user hasn't been seen before (not in `metrics.json > users.unique_users`), ask for their name. Add them to the user list. Check against the tier limit.

### 4. Load Context (this is the critical part)

Read these files in this order — the order matters because the handoff is the most time-sensitive context:

1. **`.mls/context/CHANGELOG.md`** — Read the most recent entry. The "For Next Agent" section is your direct briefing from the last agent. This tells you what's in flight, what's blocked, and what to focus on.

2. **`.mls/context/CONTEXT.md`** — The full project knowledge base. Load it all.

3. **`.mls/context/TASKS.md`** — Current tasks, priorities, and blockers.

If any file is missing (user may have deleted it accidentally), recreate it from whatever context is available and note the data loss.

### 5. Scan Modules

Read `.mls/modules/`. For each `.md` file (excluding `MODULE_TEMPLATE.md`), read its YAML frontmatter and validate:
- Does `requires_core` match the installed Core version?
- Does `requires_tier` match the current license tier?
- Is `status` set to `active`?

List valid modules as active. List invalid ones as inactive with a reason.

### 6. Check for Notion Sync

If `.mls/config.json` contains a `notion` object with `projects_data_source_id`, check if this project exists in the MLS Core Notion database:

1. Search the Projects database for a row matching this project name.
2. If found, compare the Notion row's **Content Version** with the local version.
3. If Notion is newer (another machine/user pushed changes), pull the updated Context, Active Tasks, and Agent Notes into the local files. Inform the user: "Found newer context from Notion — pulling updates from [last user]'s session."
4. If local is newer or equal, no pull needed.
5. If no row exists, that's fine — it will be created at session close.

This enables team sync without a separate sync module. If no Notion IDs are configured, skip this step.

### 7. Update Metrics

- Increment `sessions.total_count` by 1
- Record `sessions.last_session.started_at` with current timestamp
- Record the current user identifier

If `metrics.json` is corrupted, recreate with defaults and note the loss.

### 8. Display Status

Show the dynamic status display (see below).

### 9. Do NOT Begin Work Until Bootstrap is Complete

The whole point of this protocol is that the agent has full context before doing anything. Don't skip steps, don't start working early.

---

## Status Display

Generate this at every session start (first run and returning):

```
╔══════════════════════════════════════════════════╗
║  MLS Core v1.0  |  [Starter/Pro/Enterprise]      ║
║  Project: [name from CONTEXT.md or config]       ║
╠══════════════════════════════════════════════════╣
║  Sessions: [N]  |  Context entries: [N]          ║
║  Last session: [relative time, e.g. "2 days ago"]║
║  Last user: [name — only show if 2+ users]       ║
║  Handoff: "[first line of For Next Agent]"       ║
╠══════════════════════════════════════════════════╣
║  Top tasks:                                      ║
║  • [active task 1]                               ║
║  • [active task 2]                               ║
║  • [active task 3]                               ║
╠══════════════════════════════════════════════════╣
║  Modules:                                        ║
║  ✓ [active module name — description]            ║
║  ○ [inactive module — reason]                    ║
║  (none installed)                                ║
╠══════════════════════════════════════════════════╣
║  Value: ~[X] hrs context recovery saved          ║
║         [Y] sessions  |  [Z] handoffs            ║
╚══════════════════════════════════════════════════╝
```

For the first session, replace the handoff line with:
```
║  Welcome to MLS Core. Context builds from here.  ║
```

### Value Calculation

Context recovery time saved = `(sessions.total_count - 1) * 8 minutes`. This is conservative: without persistent memory, an agent spends 8-12 minutes per session re-learning context. MLS Core reduces this to under a minute. We use the low end and exclude the first session (which is setup). Display in hours when over 60 minutes.

---

## Session Close Reminder

At the end of every session, the agent should follow the session close protocol in `.mls/session-close.md`. This skill doesn't handle session close — but remind the user and the agent that it needs to happen. The close protocol:
1. Updates CONTEXT.md with new knowledge
2. Updates TASKS.md with completed/new tasks
3. Writes a CHANGELOG entry with the "For Next Agent" handoff
4. Updates metrics

The handoff note is the most important part. It's what makes the next session's bootstrap valuable. Without it, the next agent starts colder.

---

## Important Rules

- **Never start work before the bootstrap is complete.** The whole value of MLS Core is that agents have context. Skipping the bootstrap defeats the purpose.
- **The "For Next Agent" handoff is sacred.** Always read it first on returning sessions. Always write one at session close.
- **Files outside `.mls/` belong to the user.** Don't move, rename, or reorganize them unless asked. `.mls/` is the agent's workspace; everything else is the user's.
- **Core always works.** If a module fails, Core continues. If metrics are corrupted, Core continues with defaults. If a context file is missing, Core recreates it. The memory layer should never be the thing that breaks.
- **MLS Core is proprietary software by Rabbithole LLC.** Redistribution or creation of derivative products is prohibited without written permission.
