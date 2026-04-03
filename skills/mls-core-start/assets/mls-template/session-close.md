# MLS Core — Session Close Protocol

> This file defines the agent's behavior when a session ends. It ensures all context is saved, the handoff note is written, and metrics are updated. This runs at the end of every session.

---

## When to Trigger

Session close happens when:
- The user explicitly says they're done ("that's it", "end session", "close session", "wrap up")
- The user runs a session-close skill or command
- The agent detects the conversation is ending

If unsure whether the user is done, ask: "Should I close out this session and write the handoff?"

## Step 1: Context Update

Review everything that happened during this session and update the context files:

### CONTEXT.md
- **Add** any new project knowledge learned during the session (new people, decisions, domain info, resources).
- **Update** any existing entries that are now outdated or more nuanced.
- **Never delete** context without the user's explicit approval. If something seems wrong, flag it rather than removing it.
- Keep entries concise. CONTEXT.md should be scannable — paragraphs, not essays.

### TASKS.md
- **Mark completed** any tasks that were finished this session. Move them to the Completed section with the date.
- **Add** any new tasks identified during the session.
- **Update** priorities if they shifted.
- **Move to Blocked** any tasks that hit blockers, noting the reason.
- Keep the Active section focused — ideally 3-5 items. If it's growing beyond that, discuss priorities with the user.

## Step 2: Write Changelog Entry

Append a new entry to the **top** of CHANGELOG.md (most recent first):

```markdown
## Session [N] — [YYYY-MM-DD]
**User:** [identifier]
**Summary:**
- [What was accomplished — bullet 1]
- [What was accomplished — bullet 2]
- [What was accomplished — bullet 3, if needed]
- [What was accomplished — bullet 4, if needed]

**For Next Agent:**
- [What the next agent needs to know first]
- [What's currently in progress and its state]
- [What's blocked and why, if anything]
- [Recommended next step]
```

### Writing the Handoff ("For Next Agent")

This is the most important part of the session close. Write it as if you're briefing a colleague who's taking over:

- **Lead with what matters most.** If something is mid-flight, say so. If there's a decision pending, flag it.
- **Be specific.** "Auth flow is half-done, Stripe webhook handler needs the signature verification added" is better than "Continue working on payments."
- **Include blockers.** If you hit a wall, say what it was so the next agent doesn't hit the same wall.
- **End with a recommendation.** What should the next session focus on?
- **Max 4 bullets.** Force yourself to prioritize. If everything is important, nothing is.

## Step 3: Update Metrics

Update `.mls/metrics.json`:

1. Record `sessions.last_session.ended_at` with current timestamp.
2. Record `sessions.last_session.user` with the current user identifier.
3. Calculate `sessions.last_session.duration_minutes` from start to end.
4. Add duration to `sessions.total_duration_minutes`.
5. Increment `handoffs.total_count` by 1.
6. Update `handoffs.last_handoff_date`.
7. Recalculate `value.context_recovery_minutes_saved` using formula: `(sessions.total_count - 1) * 8`.
8. Recount `context.entries_count` — count each non-empty section under a `##` header in CONTEXT.md as one entry. For example, if "Project Overview" has content, that's 1 entry. If "Key Decisions" has 3 bullet points, that's still 1 entry (the section counts, not individual bullets).
9. Update `context.last_updated` with current timestamp.

Note: `sessions.total_count` is incremented at session **start**, not close. Do not double-increment here.

## Step 4: Changelog Trim

If CHANGELOG.md now has more than 30 entries:

1. Count entries (each starts with `## Session`).
2. If over 30, move the oldest entries to `.mls/context/CHANGELOG_ARCHIVE.md`.
3. Keep the 30 most recent entries in CHANGELOG.md.
4. At the bottom of CHANGELOG.md, add: `> Older entries archived in CHANGELOG_ARCHIVE.md`
5. If CHANGELOG_ARCHIVE.md already exists, prepend the moved entries (keeping chronological order within the archive).

## Step 5: Confirm Close

Tell the user the session is closed. Keep it brief:

> "Session [N] closed. Handoff written: [one-line summary of the For Next Agent lead bullet]. Context and tasks updated."

Do not give a lengthy recap. The user was there — they know what happened. The handoff note is for the *next* agent, not the current user.

## Concurrent Session Safety (Pro Tier)

If a sync module is active:

1. Before writing any updates, check if the sync layer's content version has changed since session start.
2. If it has, another session pushed changes while this one was active.
3. **Warn the user** before overwriting: "Another session updated the context while we were working. Want me to merge the changes, overwrite with ours, or show you the diff?"
4. Never silently overwrite concurrent changes.

On Starter tier (no sync module), this check is not needed — local files are the only source of truth.
