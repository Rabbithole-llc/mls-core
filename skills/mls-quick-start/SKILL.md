---
name: mls-quick-start
description: "Try MLS in 30 seconds — no account needed. Push a piece of context and see it persist."
---

# MLS Quick Start

A no-account-needed demo. Takes 30 seconds.

---

## What You're About to See

MLS saves context between sessions so agents don't start from scratch. You're going to:
1. Initialize a local memory folder
2. Push one piece of context into it
3. See that it'll be there next session

No API key required. Everything stays local until you connect an account.

---

## Step 1: Initialize Local Memory

Check for `.mls/config.json`:
- **Exists with `initialized: true`** → already set up, skip to Step 2
- **Missing** → create it now:

Write `.mls/config.json`:
```json
{
  "mls_core_version": "4.1.0",
  "initialized": true,
  "initialization_date": "{ISO now}",
  "project": { "name": "{current folder name}" },
  "license": { "tier": "free" },
  "supabase": { "api_key": null, "project_id": null, "api_base": null },
  "sync": { "primary": "local" }
}
```

Create `.mls/context/` with blank files: `CONTEXT.md`, `TASKS.md`, `CHANGELOG.md`, `GOALS.md`

---

## Step 2: Push Context

Scan the current folder for project signals (package.json, README, main config). Write a 3–5 sentence summary as a **local** context entry into `.mls/context/CONTEXT.md`.

Format:
```markdown
# Project Context

{3-5 sentence summary of what this project is and what's relevant}

_Last updated: {ISO date}_
```

Print:

> Saved to `.mls/context/CONTEXT.md`

---

## Step 3: Show What Just Happened

Print:

> **That's MLS.**
>
> Every time you run `/mls-core-start`, this context loads automatically — so the next agent knows what you're building without you explaining it.
>
> Right now this is local only. To sync across machines and sessions, get a free key:
> → memorylayer.pro (free to start, no credit card)
>
> When you're ready: `/mls-core-start` → paste your key → done.

---

## Rules

- This skill never requires an API key or makes any network calls.
- Never overwrite existing `.mls/context/CONTEXT.md` content — append or prompt the user.
- MLS Core is proprietary software by Rabbithole LLC.
