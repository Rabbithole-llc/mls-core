# MLS Core Protocol — v1.0

> Memory Layer System — persistent memory for AI agents, scoped to a single folder.
> Each folder with MLS Core installed becomes a "brain" that any agent can read, write to, and build on across sessions.

---

## What MLS Core Does

MLS Core gives AI agents persistent memory for a specific project folder. Without it, every session starts cold — the agent knows nothing about what happened before. With Core, each session starts warm: the agent knows the project context, what was worked on, what's next, and what the last agent left behind.

Core manages three foundational files in `.mls/context/`:

- **CONTEXT.md** — The project brain. What this project is, who's involved, key decisions, domain knowledge. This file grows and evolves as the agent learns more about the project.
- **TASKS.md** — What's being worked on. Current priorities, active tasks, completed work. The living to-do list that persists across sessions.
- **CHANGELOG.md** — What happened and what's next. Each session close appends an entry with a summary of work done and a "For Next Agent" handoff — a direct briefing from the last agent to the next one.

---

## Session Lifecycle

Every session follows three phases: **Start → Work → Close**. The protocols below define what happens in each phase.

### Phase 1: Session Start

On every session start, the agent MUST:

1. **Read `.mls/config.json`** — Confirm this is an initialized MLS Core instance. If `initialized` is `false` or `initialization_date` is null, this is a first run — follow the First-Run Protocol in `onboarding.md` instead. Otherwise, check the version and license tier.

2. **Check license validity** — License validation rules:
   - **Starter tier (default):** Works without a license key. Max 2 users. If user count exceeds 2, inform the user and offer Pro upgrade. Core continues to function but displays an upgrade notice on each session start.
   - **Pro tier:** Requires a valid license key. If key is missing, expired, or invalid, downgrade to Starter behavior and notify the user.
   - **Enterprise tier:** Requires a valid license key and organizational configuration.
   - If license validation fails entirely (corrupted config, unreadable file), Core operates in read-only mode — the agent can read context but should not write updates. Inform the user and suggest re-initializing.

3. **Identify the current user** — Ask the user for their name or identifier if this is their first session on this instance. On returning sessions, check if the user was seen before in `metrics.json > users.unique_users`. If not, add them and check against the tier's user limit. Store the current user identifier for use in the CHANGELOG entry at session close.

4. **Read `.mls/context/CHANGELOG.md`** — Find the most recent entry. Read the "For Next Agent" section first. This is the single most important piece of context for this session — it's a direct briefing from the last agent.

5. **Read `.mls/context/CONTEXT.md`** — Load the full project context. If the file is missing or empty (e.g., user deleted it externally), recreate it from CHANGELOG.md history and inform the user.

6. **Read `.mls/context/TASKS.md`** — Load current tasks and priorities. If the file is missing or empty, recreate a minimal version and inform the user.

7. **Scan for modules** — Read the `.mls/modules/` directory. For each `.md` file found (excluding MODULE_TEMPLATE.md), read its frontmatter and check:
   - Does `requires_core` match the current Core version?
   - Does `requires_tier` match the instance's license tier?
   - Is `status` set to `active`?
   Modules that pass validation are listed as active. Modules that fail are listed as inactive with a reason (e.g., "requires Pro tier", "Core version too low", "status: disabled").

8. **Update metrics** — Increment `sessions.total_count` by 1 in `.mls/metrics.json`. Record the session start timestamp in `sessions.last_session.started_at`. Record the current user identifier. If `metrics.json` is corrupted or invalid JSON, recreate it with default values and note the data loss.

9. **Display session status** — Show the dynamic status display (see Status Display section below).

**Do not begin work until the full bootstrap is complete.**

### Phase 2: Work

During a session, the agent follows these rules:

- **CONTEXT.md is append-and-refine.** When the agent learns something new about the project, add it to CONTEXT.md. When existing context is outdated, update it. Never delete context without the user's explicit approval.

- **TASKS.md is the work tracker.** When the user assigns work, add it to TASKS.md. When work is completed, mark it done (don't delete — move to a "Completed" section). When priorities change, reorder.

- **CHANGELOG.md is append-only during a session.** Don't write to it during the session — that happens at session close.

- **Files outside `.mls/` are the user's files.** The agent reads them for context but does not move, rename, or reorganize them unless explicitly asked. The `.mls/` directory is the agent's workspace; everything outside it belongs to the user.

- **Module interactions.** If modules are installed in `.mls/modules/`, the agent may use them according to their declared interface. See the Module Interface Contract section.

### Phase 3: Session Close

Before ending a session, the agent MUST:

1. **Update CONTEXT.md** — Add any new project context learned during this session. Refine any outdated entries.

2. **Update TASKS.md** — Mark completed tasks. Add any new tasks identified. Update priorities if they changed.

3. **Append to CHANGELOG.md** — Add a new entry **at the top of the file** (most recent first) with:
   - **Date and session number**
   - **User identifier**
   - **Summary** — What was accomplished this session (2-4 bullets)
   - **For Next Agent** — A direct briefing for the next agent (max 4 bullets). This is forward-looking: what should the next agent know, what's in progress, what's blocked, what's the recommended next step. Write this as if you're handing off to a colleague. The agent MUST write a handoff note — it is not optional.

4. **Update metrics.json** — Record session end timestamp, calculate session duration, add duration to `total_duration_minutes`, increment `handoffs.total_count` by 1, recalculate `value.context_recovery_minutes_saved`, and recount `context.entries_count`.

5. **Trim CHANGELOG.md** — If the changelog exceeds 30 entries, move the oldest entries to `.mls/context/CHANGELOG_ARCHIVE.md`. Keep the most recent 30 in the main file.

6. **Confirm close** — Tell the user the session is closed and give a one-line summary of the handoff note.

---

## Status Display

At every session start, generate a status display:

```
╔══════════════════════════════════════════════╗
║  MLS Core v1.0  |  [Tier]                    ║
║  Project: [from CONTEXT.md title]            ║
╠══════════════════════════════════════════════╣
║  Sessions: [count]  |  Context entries: [n]  ║
║  Last session: [relative time]               ║
║  Last user: [user identifier]                ║
║  Handoff: "[first line of For Next Agent]"   ║
╠══════════════════════════════════════════════╣
║  Top tasks:                                  ║
║  • [task 1]                                  ║
║  • [task 2]                                  ║
║  • [task 3]                                  ║
╠══════════════════════════════════════════════╣
║  Modules:                                    ║
║  ✓ [installed module 1]                      ║
║  ✓ [installed module 2]                      ║
╠══════════════════════════════════════════════╣
║  Value: ~[X] hrs context recovery saved      ║
║         [Y] handoffs completed               ║
╚══════════════════════════════════════════════╝
```

The "Last user" field shows on instances with 2+ users. On single-user instances, omit it.

---

## First-Run Protocol

If `.mls/config.json` does not exist or `initialized` is `false`, this is a first run. The agent MUST:

1. **Welcome the user.** Explain what MLS Core is in plain language: "MLS Core gives your AI agents persistent memory for this folder. Every session builds on the last one — no more starting from scratch."

2. **Explain the file structure.** Walk through what CONTEXT.md, TASKS.md, and CHANGELOG.md are and why they matter. Keep it brief — 1-2 sentences each.

3. **Offer setup options** (in this order):
   - **[Recommended] Seed from existing files.** "I see [N] files in this folder. Want me to read through them and build your initial project context? Your files stay exactly where they are — I'll just learn from them." Scan all readable files in the project folder (not `.mls/`), build CONTEXT.md from what's found, identify potential tasks for TASKS.md.
   - **Guided setup.** "I'll ask you a few questions about your project, goals, and priorities, then set everything up." Ask: What is this project? Who's involved? What are the current priorities? What should I know about the domain?
   - **Skip and build organically.** "I'll set up the structure now and learn about your project as we work together." Create minimal template files and fill in context over subsequent sessions.

4. **Initialize config.json** with version, tier, license key (if provided), and creation timestamp.

5. **Initialize metrics.json** with zeroed stats.

6. **Create initial context files** based on the chosen setup option.

7. **Write the first CHANGELOG.md entry** — "MLS Core initialized. Setup method: [seed/guided/organic]."

8. **Display the first status block** — even on first run, show the status display. Sessions: 1, context entries: [N], modules: none.

---

## Value Metrics

MLS Core tracks usage metrics in `.mls/metrics.json` to demonstrate the value it provides. Metrics are updated at session start and session close.

### What We Track
- **Session count** — Total sessions on this Core instance.
- **Unique users** — How many distinct users have used this instance.
- **Context entries** — Number of distinct facts/items in CONTEXT.md (count by meaningful paragraphs or bullet points).
- **Handoff count** — Number of "For Next Agent" entries in CHANGELOG.md.
- **Total session time** — Cumulative time across all sessions.
- **Context recovery estimate** — Conservative estimate of time saved. Formula: `(session_count - 1) * 8 minutes`. Rationale: without persistent context, an agent spends approximately 8-12 minutes per session re-learning project context through questions and file reading. MLS Core reduces this to under 1 minute. We use the conservative end (8 min) and don't count the first session (which is setup).

### How to Display
At session start, show the cumulative value. Keep figures honest — if someone has had 10 sessions, that's ~72 minutes (1.2 hours) saved on context recovery. Don't inflate.

---

## Module Interface Contract

Modules are files placed in `.mls/modules/`. Each module is a markdown file with a standard header that Core uses for discovery and validation.

### Module File Format

```markdown
---
module_name: [human-readable name]
module_type: [sync | hub | agent | utility]
module_version: [semver]
requires_core: [minimum Core version, e.g., ">=1.0"]
requires_tier: [starter | pro | enterprise]
description: [one-line description]
status: [active | disabled | error]
---

[Module-specific instructions and protocol follow here]
```

### Module Types

- **sync** — Handles remote synchronization (Notion, Supabase, etc.). Reads and writes `.mls/context/` files to/from a remote source. Only one sync module may be active at a time.
- **hub** — Connects multiple Core instances into a unified project view. Requires a sync module to be active. Pro tier minimum.
- **agent** — Purpose-built agents that read Core's context and perform specific work (content creation, social media management, etc.). Each agent module declares what context files it reads and writes.
- **utility** — Helper modules (analytics, export, backup, etc.).

### Discovery

At session start, Core scans `.mls/modules/` and reads the frontmatter of each `.md` file. It checks:
1. Does the module's `requires_core` match the current Core version?
2. Does the module's `requires_tier` match the instance's license tier?
3. Is the module's `status` set to `active`?

Modules that fail validation are listed as inactive in the status display with a reason.

### Data Access

Modules interact with Core through the context files:
- **Read access:** All modules can read any file in `.mls/context/`.
- **Write access:** Modules declare which files they write to in their frontmatter `writes` field. The agent should only allow a module to write to files it has declared. A sync module typically writes to all context files. An agent module might only append to TASKS.md and CHANGELOG.md. Modules should **never delete** content from Core files — they may add or update only.
- **Write conflict prevention:** If two modules declare writes to the same file, they should not run simultaneously. The agent should execute them sequentially and ensure each module's changes are saved before the next runs.
- **Module-specific storage:** Modules may create their own files in `.mls/modules/[module_name]/` for internal state. These files are private to the module and are not read by other modules unless explicitly shared via a `shares` field in the frontmatter.
- **Module dependencies:** If a module depends on another module (e.g., hub requires sync), it declares `depends_on: ["sync"]` in its frontmatter. Core checks that dependencies are installed and active before loading the module.

### Graceful Degradation

Core always works, regardless of module state. If a module errors, crashes, or is misconfigured:
- Core continues to function normally.
- The module is marked as `status: error` in the status display.
- The agent informs the user which module failed and why.
- No module failure should prevent Core's session start, work, or close protocols from completing.

---

## Changelog Management

CHANGELOG.md entries follow this format:

```markdown
## Session [N] — [YYYY-MM-DD]
**User:** [identifier]
**Summary:**
- [What was accomplished, bullet 1]
- [What was accomplished, bullet 2]
- [What was accomplished, bullet 3]

**For Next Agent:**
- [Forward-looking briefing, bullet 1]
- [Forward-looking briefing, bullet 2]
- [What's in progress or blocked]
- [Recommended next step]
```

When CHANGELOG.md exceeds 30 entries:
1. Keep the 30 most recent entries in CHANGELOG.md (newest at top).
2. Move older entries to `.mls/context/CHANGELOG_ARCHIVE.md`, appended at the bottom (oldest first, chronological order within the archive).
3. Add a note at the bottom of CHANGELOG.md: "> Older entries archived in CHANGELOG_ARCHIVE.md"

### Context Size Management

If CONTEXT.md grows beyond ~100KB (roughly 2000+ lines), the agent should:
1. Review entries for relevance — flag items that are outdated or no longer applicable.
2. Suggest archiving old context to `.mls/context/CONTEXT_ARCHIVE.md` with user approval.
3. Keep CONTEXT.md focused on current, relevant project knowledge.

---

## Versioning

MLS Core uses semantic versioning: `major.minor.patch`

- **Major** — Breaking changes to the protocol or file format. Requires migration.
- **Minor** — New features, new module types, protocol additions. Backward compatible.
- **Patch** — Bug fixes, wording improvements. No behavioral change.

The current version is stored in `config.json`. When a new version of Core is available, the session start protocol should notify the user and offer to upgrade. The upgrade process is defined per version in the release notes — there is no automatic upgrade without user consent.

Each organization's MLS Core instance versions independently. Core updates provide a migration path but are never forced.

---

## IP and Licensing

MLS Core is proprietary software created by Rabbithole LLC. Usage is governed by the license tier associated with the instance's license key.

### Tiers
- **Starter** — Single folder, up to 2 users, local-only operation. Core features only.
- **Pro** — Sync module, hub support, unlimited users, weekly email digest, priority support.
- **Enterprise** — Centralized management, permissions, audit trails, custom integrations.

The license key is stored in `config.json` and validated at session start. Core operates in read-only mode without a valid license — agents can read existing context but should not update files.

Redistribution, resale, or creation of derivative products from MLS Core files is prohibited without written permission from Rabbithole LLC.
