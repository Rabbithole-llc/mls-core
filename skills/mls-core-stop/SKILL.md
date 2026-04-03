---
name: mls-core-stop
description: "Session close for MLS Core — the Memory Layer System. Handles end-of-session protocol: updating project context, marking completed tasks, writing the 'For Next Agent' handoff note, updating value metrics, and syncing to the remote database if a sync module is connected. Use this skill whenever the user says /mls-core-stop, 'end session', 'close session', 'wrap up', 'save and close', 'session close', or when the conversation is clearly ending and a .mls/ directory exists in the workspace. Also trigger if the user says 'sync', 'push to notion', 'save progress', or 'write handoff'. This skill is critical — without it, the next session starts cold and the persistent memory chain breaks."
---

# MLS Core — Session Close

You are running the MLS Core session close protocol. This is one of the most important moments in the MLS lifecycle — it's where you preserve everything this session accomplished so the next agent can pick up seamlessly.

If you skip this or do it poorly, the next session starts colder, context is lost, and the user has to re-explain things. That's the exact problem MLS Core exists to solve.

---

## Step 0: Verify MLS Core is Active

Check that `.mls/config.json` exists and `initialized` is `true`. If MLS Core isn't initialized on this folder, tell the user:

> "MLS Core isn't set up on this folder yet. Would you like me to initialize it? You can run /mls-core-start to set it up."

If it is initialized, proceed.

---

## Step 1: Update CONTEXT.md

Review everything that happened during this session. Read the current `.mls/context/CONTEXT.md` and update it:

**Add** any new project knowledge learned during the session:
- New people, roles, or stakeholders mentioned
- Decisions made and the reasoning behind them
- Domain knowledge or terminology that came up
- Resources, tools, APIs, or accounts referenced
- Strategic context or business constraints discussed

**Update** any existing entries that are now outdated or more nuanced. Projects evolve — what was true last session might have changed.

**Never delete** context without the user's explicit approval. If something seems wrong or outdated, flag it to the user rather than removing it. Context that seems irrelevant now might matter later.

Keep entries concise and scannable. CONTEXT.md should be a knowledge base, not a transcript. Paragraphs and organized sections, not walls of text.

---

## Step 2: Update TASKS.md

Read the current `.mls/context/TASKS.md` and update it:

- **Mark completed** tasks that were finished this session. Move them to the "Completed" section with the date. Don't delete them — completed tasks provide context about the project's history.
- **Add new tasks** identified during the session to the appropriate section (Active, Up Next, or Blocked).
- **Update priorities** if they shifted during the session. What was "Up Next" might now be "Active."
- **Move to Blocked** any tasks that hit blockers, noting the specific reason (so the next agent doesn't waste time hitting the same wall).
- **Keep Active focused** — ideally 3-5 items. If the Active section is growing beyond that, it's worth discussing priorities with the user before closing.

---

## Step 3: Write the Changelog Entry

This is the most important step. Append a new entry **at the top** of `.mls/context/CHANGELOG.md` (most recent first):

```markdown
## Session [N] — [YYYY-MM-DD]
**User:** [identifier]
**Summary:**
- [What was accomplished — be specific, not vague]
- [What was accomplished — mention files, features, decisions]
- [What was accomplished — include anything the next agent should know happened]

**For Next Agent:**
- [What the next agent needs to know first — the single most important thing]
- [What's currently in progress and its exact state]
- [What's blocked and why, if anything]
- [Recommended next step — what should the next session focus on]
```

### Writing a Great Handoff

The "For Next Agent" section is a direct briefing from you to the next agent. Write it like you're handing off to a colleague who's taking your shift:

- **Lead with what matters most.** If something is mid-flight, say so and describe its state. "Auth flow is implemented but untested — the Stripe webhook handler still needs signature verification" is far better than "Continue working on payments."

- **Be specific.** File names, function names, decision points, exact error messages. The next agent doesn't have your context — give them enough to pick up without asking the user to re-explain.

- **Include blockers explicitly.** If you hit a wall, describe it. The next agent will hit the same wall if you don't warn them.

- **End with a clear recommendation.** What should the next session focus on? This gives the next agent a starting point instead of asking "what would you like to work on?"

- **Max 4 bullets.** Force yourself to prioritize. If everything seems important, decide what's *most* important. The constraint makes the handoff better, not worse.

The handoff note is **not optional**. Every session close must include one. This is what makes the persistent memory chain work — each session's handoff is the next session's starting context.

---

## Step 4: Update Metrics

Read `.mls/metrics.json` and update:

1. `sessions.last_session.ended_at` → current ISO timestamp
2. `sessions.last_session.user` → current user identifier
3. `sessions.last_session.duration_minutes` → calculate from `started_at` to now
4. `sessions.total_duration_minutes` → add this session's duration
5. `handoffs.total_count` → increment by 1
6. `handoffs.last_handoff_date` → current ISO date
7. `value.context_recovery_minutes_saved` → recalculate: `(sessions.total_count - 1) * 8`
8. `context.entries_count` → recount sections in CONTEXT.md (each `##` header with content = 1 entry)
9. `context.last_updated` → current ISO timestamp

If `metrics.json` is corrupted or invalid, recreate it with what you can infer from the context files and note the data loss.

---

## Step 5: Trim Changelog if Needed

Count entries in CHANGELOG.md (each starts with `## Session`):

- If 30 or fewer entries → do nothing
- If more than 30 entries:
  1. Keep the 30 most recent entries in CHANGELOG.md
  2. Move older entries to `.mls/context/CHANGELOG_ARCHIVE.md`, appended at the bottom in chronological order (oldest first)
  3. Add at the bottom of CHANGELOG.md: `> Older entries archived in CHANGELOG_ARCHIVE.md`

---

## Step 6: Sync to Remote (if sync module is active)

Check `.mls/modules/` for an active sync module (any module with `module_type: sync` and `status: active`).

### If a sync module exists:

1. **Check for concurrent changes.** Before pushing, compare the remote's content version with what you loaded at session start. If the remote version changed (meaning another session pushed while this one was active):
   - **Warn the user:** "Another session updated the context while we were working. Would you like me to merge the changes, overwrite with ours, or show you the differences?"
   - **Never silently overwrite concurrent changes.** This is critical for teams.

2. **Push updates.** Follow the sync module's specific push protocol. At minimum, sync these files:
   - CONTEXT.md
   - TASKS.md
   - CHANGELOG.md (latest entry at minimum)
   - metrics.json

3. **Confirm sync.** Tell the user: "Changes synced to [remote name]."

### If no sync module exists but Notion IDs are in config.json:

Check `.mls/config.json` for a `notion` object. If it contains `projects_data_source_id`, you can sync directly to the MLS Core Notion database. This is the default sync path for all MLS Core instances.

**Notion sync steps:**
1. Search the MLS Core Projects database (data source ID from `config.json > notion.projects_data_source_id`) for a row matching this project name.
2. If no row exists, create one.
3. Update the row with:
   - **Context** — Current contents of CONTEXT.md (condensed if too long)
   - **Active Tasks** — Current Active and Blocked sections from TASKS.md
   - **Changelog** — Most recent 3-5 session entries from CHANGELOG.md
   - **Content Version** — Increment by 1
   - **MLS Version** — From config.json `mls_core_version`
   - **Agent Notes** — The "For Next Agent" section from the latest CHANGELOG entry
   - **Session Count** — From metrics.json
   - **Time Saved (min)** — From metrics.json `value.context_recovery_minutes_saved`
   - **Users** — From metrics.json `users.unique_users`
   - **Last Synced** — Current datetime
   - **Status** — "Active"

### If no sync module AND no Notion IDs:

Everything is local. No sync step needed. The context files in `.mls/context/` are the source of truth.

If the user asks to sync ("push to Notion", "save to database", etc.) but no sync is configured, let them know:

> "No sync is configured on this Core instance. Your context is saved locally. To enable Notion sync, add the MLS Core Notion IDs to your config.json, or install a sync module for other providers."

---

## Step 7: Confirm Close

Tell the user the session is closed. Keep it brief — they were there, they know what happened:

> "Session [N] closed. Handoff written: '[first line of For Next Agent note]'. Context and tasks updated. [If synced: 'Synced to [remote].']"

Then show a compact value summary:

> "MLS Core has saved you approximately [X] hours of context recovery across [N] sessions."

Don't give a lengthy recap of the session. The handoff note is for the *next agent*, not the current user.

---

## What If the User Doesn't Explicitly Close?

If the conversation is winding down and you detect the session is ending (user says "thanks", "that's all", "bye", or stops engaging), prompt them:

> "Before we wrap up, should I run the MLS Core session close? This saves your context and writes the handoff for the next session."

Don't run it without asking. But do remind them — a missed session close means a colder next session.

---

## Error Recovery

Things that might go wrong and how to handle them:

- **CONTEXT.md or TASKS.md was deleted externally.** Recreate from CHANGELOG.md history and this session's work. Note the data loss to the user.
- **metrics.json is corrupted.** Recreate with defaults. Infer what you can (session count from CHANGELOG entries, user list from CHANGELOG entries).
- **Sync module fails.** Complete the local close (steps 1-5) regardless. Inform the user the sync failed and their changes are saved locally. Suggest retrying sync next session.
- **CHANGELOG.md is missing.** Create it with just this session's entry. Note that history was lost.

The principle: **local close always succeeds.** Sync is a bonus. Core's value (persistent context across sessions) works even if the remote layer is down.

---

## Important Rules

- **The handoff note is mandatory.** Every single session close must include a "For Next Agent" section. No exceptions. This is the backbone of MLS Core's value.
- **Never skip context updates to save time.** The 2-3 minutes it takes to update CONTEXT.md and TASKS.md saves 8+ minutes at the start of the next session.
- **Don't over-summarize.** The session close is not a project report. Update the files, write the handoff, confirm, done.
- **Respect concurrent changes.** On Pro tier with sync, always check before pushing. Silent overwrites destroy trust.
- **MLS Core is proprietary software by Rabbithole LLC.** Redistribution or creation of derivative products is prohibited without written permission.
