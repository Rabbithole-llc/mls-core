# MLS Core — First-Run Onboarding Protocol

> This file defines the agent's behavior when MLS Core is initialized for the first time on a folder. It runs once — when `config.json` has `"initialized": false`.

---

## Detection

Check `.mls/config.json`. If `initialized` is `false` or the file is missing key values (no `initialization_date`, no `project.name`), this is a first run.

## Step 1: Welcome

Greet the user warmly and explain MLS Core in one clear paragraph:

> "Welcome to MLS Core. I'm setting up persistent memory for this folder — which means from now on, every AI session here builds on the last one. I'll remember your project context, track what you're working on, and hand off notes between sessions so nothing gets lost. Let me walk you through how it works."

## Step 2: Explain the System

Briefly introduce the three core files. Keep each to 1-2 sentences:

- **CONTEXT.md** — "This is your project's brain. I'll build up knowledge about what you're working on, key decisions, who's involved, and important domain details. It grows over time."
- **TASKS.md** — "This tracks your active work, what's coming next, and what's done. Think of it as a living to-do list that persists between sessions."
- **CHANGELOG.md** — "Every time we end a session, I write a summary of what happened and a handoff note for the next session. It's how continuity works — the next agent reads the handoff and knows exactly where things stand."

## Step 3: Setup Options

Present three options. Recommend option 1 if files exist in the folder, option 2 if the folder is empty.

### Option 1: Seed from Existing Files [Recommended if files exist]

Scan the project folder (excluding `.mls/`) for readable files. Count them and tell the user:

> "I see [N] files in this folder. I can read through them to build your initial project context. Your files stay exactly where they are — I'll just learn from them and populate your project memory. This is the fastest way to get started. Want me to do that?"

If yes:
1. Read all readable files (text, markdown, code, PDFs if possible). Skip binary files, images, and very large files (>1MB).
2. Build CONTEXT.md: extract project purpose, key themes, people mentioned, technologies used, decisions documented.
3. Build TASKS.md: identify anything that looks like active work, to-dos, or priorities.
4. Show the user what you built and ask for corrections or additions.

### Option 2: Guided Setup [Recommended if folder is empty]

Ask the user a short series of questions. Keep it to 4-5 questions max — don't overwhelm:

1. "What's this project about? Give me the elevator pitch."
2. "Who's involved? Just names and roles."
3. "What are you currently working on? Top 2-3 priorities."
4. "Anything I should know about the domain — terminology, constraints, key tools?"
5. "Any important decisions that have already been made that I should remember?"

Build CONTEXT.md and TASKS.md from their answers. Show what you built and ask for corrections.

### Option 3: Skip — Build Organically

> "No problem. I'll set up the structure now and learn about your project as we work together. Context will fill in naturally over the next few sessions."

Create the template files with minimal content. The agent builds context organically from each session's work.

## Step 4: Initialize

Regardless of which option was chosen:

1. **Update config.json:**
   - Set `initialized` to `true`
   - Set `initialization_date` to current timestamp
   - Set `setup_method` to `"seed"`, `"guided"`, or `"organic"`
   - Set `project.name` from what was learned (or ask the user for a project name)

2. **Initialize metrics.json:**
   - Generate a unique `instance_id` (use timestamp + random suffix)
   - Set `created_at` to current timestamp
   - Set `sessions.total_count` to `1`
   - Add the current user to `users.unique_users`
   - Set `users.total_count` to `1`

3. **Write the first CHANGELOG entry:**

```markdown
## Session 1 — [YYYY-MM-DD]
**User:** [identifier]
**Summary:**
- MLS Core v1.0 initialized on this folder
- Setup method: [seed from existing files / guided setup / organic]
- [If seeded: "Built initial context from N existing files"]
- [If guided: "Built initial context from user onboarding"]

**For Next Agent:**
- This is a fresh MLS Core instance — context is [rich from file seeding / initial from guided setup / minimal, will build organically]
- Project: [brief description]
- [Any immediate priorities identified]
- Continue building context from each session's work
```

## Step 5: First Status Display

Show the status display even on first run. It will be minimal but sets the expectation:

```
╔══════════════════════════════════════════════╗
║  MLS Core v1.0  |  Starter                   ║
║  Project: [name]                             ║
╠══════════════════════════════════════════════╣
║  Sessions: 1  |  Context entries: [N]        ║
║  Setup: [seed/guided/organic]                ║
╠══════════════════════════════════════════════╣
║  Top tasks:                                  ║
║  • [task 1 if any]                           ║
╠══════════════════════════════════════════════╣
║  Modules: none installed                     ║
╠══════════════════════════════════════════════╣
║  Welcome to MLS Core. Context builds from    ║
║  here — every session makes the next better. ║
╚══════════════════════════════════════════════╝
```

## Step 6: Begin Work

After onboarding is complete, ask the user what they'd like to work on. The first session has started — proceed with normal Phase 2 (Work) from core.md.
