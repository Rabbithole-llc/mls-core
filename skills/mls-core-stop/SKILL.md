---
name: mls-core-stop
description: "Session close for MLS Core. Saves context, marks completed tasks, writes the 'For Next Agent' handoff, updates goals and metrics, syncs to remote. Trigger on /mls-core-stop, 'end session', 'wrap up', 'save and close', or 'write handoff'."
---

# MLS Core V3 — Session Close

You are running the MLS Core session close protocol. This is one of the most important moments in the MLS lifecycle — it's where you preserve everything this session accomplished so the next agent can pick up seamlessly.

If you skip this or do it poorly, the next session starts colder, context is lost, and the user has to re-explain things. That's the exact problem MLS Core exists to solve.

---

## Step 0: Verify MLS Core is Active

Check that `.mls/config.json` exists and `initialized` is `true`. If MLS Core isn't initialized on this folder, tell the user:

> "MLS Core isn't set up on this folder yet. Would you like me to initialize it? You can run /mls-core-start to set it up."

If it is initialized, proceed.

### Self-Heal Before Close

Before starting the close protocol, validate the `.mls/` structure. If any files are missing or corrupted, repair them before attempting to update:

| Missing or corrupted | Recovery |
|---|---|
| `config.json` invalid JSON | Rename to `config.json.backup`. Recreate from what you know about the project. Warn user. |
| `CONTEXT.md` missing | Recreate from this session's conversation context and any CHANGELOG history. |
| `TASKS.md` missing | Recreate from this session's work. Add any known tasks. |
| `CHANGELOG.md` missing | Create with just this session's entry. Note history was lost. |
| `GOALS.md` missing | Create from template. Seed from any goals discussed this session. |
| `FEEDBACK.md` missing | Create from template. |
| `PREFERENCES.md` missing | Create from template. |
| `CORRECTIONS.md` missing | Create from template. |
| `metrics.json` missing or invalid | Recreate with defaults. Infer session count from CHANGELOG entries. |
| `modules/` missing | Recreate directory with MODULE_TEMPLATE.md. |

**Principle: Close always completes.** No missing file should prevent the session close from running to completion.

---

## Step 1: Update CONTEXT.md

Review everything that happened during this session. Read the current `.mls/context/CONTEXT.md` and update it:

**Add** any new project knowledge learned during the session:
- New people, roles, or stakeholders mentioned
- Decisions made and the reasoning behind them
- Domain knowledge or terminology that came up
- Resources, tools, APIs, or accounts referenced
- Strategic context or business constraints discussed

**Update** any existing entries that are now outdated or more nuanced.

**Never delete** context without the user's explicit approval.

Keep entries concise and scannable. CONTEXT.md should be a knowledge base, not a transcript.

---

## Step 2: Update TASKS.md

Read the current `.mls/context/TASKS.md` and update it:

- **Mark completed** tasks that were finished this session. Move to "Completed" section with the date.
- **Add new tasks** identified during the session.
- **Update priorities** if they shifted.
- **Move to Blocked** any tasks that hit blockers, noting the specific reason.
- **Keep Active focused** — ideally 3-5 items.

---

## Step 2.5: Update GOALS.md ← NEW in v2

Read `.mls/context/GOALS.md` and update active goals:

1. **Review active goals** — did this session make progress on any?
2. **Update progress percentages** and status for each affected goal.
3. **If a goal was completed** → move to "Completed Goals" with date and outcome.
4. **If a goal is blocked** → update status to "blocked" with reason.
5. **If new goals were discussed** → add to "Active Goals" with initial progress.
6. **Link completed tasks to their parent goal** — this connection shows up in the changelog.

---

## Step 3: Write the Changelog Entry

This is the most important step. Append a new entry **at the top** of `.mls/context/CHANGELOG.md`:

```markdown
## Session [N] — [YYYY-MM-DD] | [tag]
**User:** [identifier]
**Goals progress:**
- [Goal 1]: [X]% → [Y]% ([what advanced it])
**Summary:**
- [What was accomplished — be specific, not vague]
- [What was accomplished — mention files, features, decisions]
- [What was accomplished — include anything the next agent should know]

**For Next Agent:**
- [What the next agent needs to know first — the single most important thing]
- [What's currently in progress and its exact state]
- [What's blocked and why, if anything]
- [Recommended next step — what should the next session focus on]

**Hub Context** *(only include if `hub.share_intelligence = true` AND hub brain entries were loaded at session start)*:
> From {hub.display_name}: [1–3 most relevant hub entries summarized in 1–2 lines each, selected by relevance to this session's work. Hard cap: 400 tokens total for this block. If no hub entries are relevant to this session, omit this section entirely rather than padding it.]
```

*Hub Context inclusion rules:*
- Read the hub brain entries stored during Step 4.6 of session start
- Filter to entries relevant to this session's tag and work — use your judgment
- Summarize concisely; the next agent needs signal, not verbatim dumps
- If `hub_context_rules.auto_append_to_handoff = false`, skip entirely
- If hub brain was not called (tier too low, sharing off, or API failed), skip entirely

### Session Tag

Auto-infer a tag based on what happened during the session. Include it in the header after the date.

| Tag | When to use |
|---|---|
| `strategy` | Planning, architecture, decision-making, roadmap work |
| `build` | Writing code, creating files, implementing features |
| `debug` | Fixing bugs, troubleshooting, investigating errors |
| `review` | Code review, content review, document review |
| `planning` | Task planning, sprint planning, prioritization |
| `research` | Looking things up, comparing options, exploring APIs |
| `design` | UI/UX work, design systems, mockups |
| `admin` | MLS Core setup, config changes, maintenance |
| `mixed` | Session covered multiple types equally |

No need to ask the user — inference is fine. If the user corrects it, update.

### Writing a Great Handoff

- **Lead with what matters most.** If something is mid-flight, describe its exact state.
- **Be specific.** File names, function names, decision points, exact error messages.
- **Include blockers explicitly.** The next agent will hit the same wall if you don't warn them.
- **End with a clear recommendation.** What should the next session focus on?
- **Max 4 bullets.** Force prioritization.

The handoff note is **not optional**. Every session close must include one.

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
10. `session_tags.[tag]` → increment the tag used in this session's changelog entry ← NEW in v2
11. `goals.active` → count active goals in GOALS.md ← NEW in v2
12. `goals.completed` → count completed goals ← NEW in v2

**Self-heal:** If `metrics.json` is corrupted or invalid, recreate it. Infer session count from CHANGELOG entries, user list from CHANGELOG user fields.

---

## Step 4.5: Collect Feedback ← NEW in v2

Check `config.json > preferences.feedback.enabled`. If false, skip.

### Protocol:

1. **Ask the user** (lightweight, one interaction):
   > "Quick check — how was this session?"
   > Options: **Great** / **Good** / **Mixed** / **Not great**

2. **If "Mixed" or "Not great"**, follow up once:
   > "Anything specific I should do differently next time?"
   > (Free text, or skip)

3. **Agent writes self-assessment** (if `preferences.feedback.collect_agent_self_assessment` is true):
   Reflect on the session and write one line about what could improve. This is NOT shown to the user — it's internal. Examples:
   - "Spent too long exploring options before acting"
   - "Should have confirmed requirements before starting the build"
   - "Good session — delivered exactly what was asked"

4. **Append to FEEDBACK.md** under "Recent Feedback" (newest first):
   ```markdown
   ### Session [N] — [YYYY-MM-DD] | [tag]
   **Rating:** [great / good / mixed / poor]
   **User comment:** [optional one-liner, or "—" if skipped]
   **Agent self-assessment:** [one line internal reflection]
   ```

5. **Check for patterns** — If 3+ recent entries share a theme (e.g., "too verbose", "didn't check first", "great at planning"), distill it into the **Patterns** section. Use judgment — don't create a pattern from noise.

6. **Keep Recent Feedback to 10 entries.** Move older entries out (patterns are preserved regardless).

7. **Update metrics.json:**
   - `feedback.total_collected` → increment
   - `feedback.ratings.[rating]` → increment
   - `feedback.avg_satisfaction` → recalculate (great=4, good=3, mixed=2, poor=1)
   - `feedback.patterns_identified` → count of patterns in FEEDBACK.md

### Friction Target

- **Minimum:** 1 click (rating only)
- **Maximum:** 2 interactions (rating + optional comment)
- **Never blocks close.** If user doesn't respond or says "skip," log as skipped (`feedback.total_skipped` increment) and move on.

---

## Step 4.7: Log Corrections ← NEW in v2

Scan the session for moments where the user corrected the agent:

- **Explicit corrections:** "No, that's wrong. It should be X."
- **Implicit corrections:** User rewrites agent output significantly, or redirects approach.

For each correction found:

1. **Log in CORRECTIONS.md** under "Active Corrections":
   ```markdown
   ### [YYYY-MM-DD] Session [N]
   **Wrong:** [What the agent assumed or did incorrectly]
   **Correct:** [What the user corrected it to]
   **Context:** [Why this matters / when it comes up]
   ```

2. **Cross-reference with CONTEXT.md** — if a correction contradicts something in CONTEXT.md, update CONTEXT.md too.

3. **Update metrics.json:**
   - `corrections.total_logged` → increment
   - `corrections.active` → count of active corrections

If no corrections occurred this session, skip silently.

---

## Step 4.8: Update PREFERENCES.md ← NEW in v2

Check if any user preferences were expressed during this session:

1. **Explicit preferences:** User said "I prefer X" or "don't do Y" or "always use Z."
   → Add directly to the appropriate section of PREFERENCES.md.

2. **Feedback-to-preference promotion:** If a pattern in FEEDBACK.md has solidified (3+ occurrences), promote it to PREFERENCES.md as a confirmed preference.

**The pipeline:** Feedback → Patterns → Preferences → Better sessions.

If no new preferences were identified, skip silently.

---

## Step 5: Trim Changelog if Needed

Count entries in CHANGELOG.md (each starts with `## Session`):

- If 30 or fewer → do nothing
- If more than 30:
  1. Keep the 30 most recent entries in CHANGELOG.md
  2. Move older entries to `.mls/context/CHANGELOG_ARCHIVE.md`
  3. Add at the bottom: `> Older entries archived in CHANGELOG_ARCHIVE.md`

---

## Step 6: Fire Agent Close Hook

If `.agents/on_session_close.md` exists, read and execute its instructions. This file is owned by the Agentic Layer — MLS Core does not manage its contents.

If the file doesn't exist, skip this step silently. Agents are optional.

If the hook file exists but execution fails, log the error and continue. Agent hooks never block session close.

---

## Step 6.5: Circuit Breaker Pre-flight

Before attempting any Supabase call, check the global sync health state.

1. **Read `~/.mls/sync_health.json`** (user-level, shared across all projects).
   - If missing, create with defaults: `{"status":"closed","failure_count":0,"last_failure_at":null,"last_success_at":null}`

2. **Evaluate circuit status:**

   | Status | Action |
   |---|---|
   | `closed` | Proceed to Step 7 Supabase path normally |
   | `open`, last_failure_at < 15 min ago | Skip Supabase → fall through to Notion or local-only |
   | `open`, last_failure_at ≥ 15 min ago | Flip to `half-open`, attempt one Supabase call as test |
   | `half-open` | Attempt once — success resets to `closed`, failure returns to `open` |

3. **After the session-end API call, update sync_health.json accordingly.**
   - Auth errors (401/403) = config error, not a circuit trip. Surface to user, do not increment failure_count.

> **Principle:** Session close (Steps 1–6) always completes. The circuit breaker only affects whether Supabase sync is attempted. A tripped circuit never blocks the close.

---

## Step 7: Sync to Remote

### Tier Check Before Sync

Read `config.json > license.tier` and `license.local_only`:

- **If `local_only` is `true`:** Skip all Supabase sync (no API key or API unreachable). Fall through to Notion if configured, otherwise complete the close with local files only. Surface once: "Session closed locally. Register at https://memorylayer.pro to enable cloud sync."
- **If tier is `"free"`:** Supabase sync proceeds normally — free users get limited cloud sync (3 projects, 30-day history enforced server-side). Never send `hub_shared: true` — free users don't have community features. If the server rejects due to project/history limits, surface the error and continue with local files.
- **If tier is `"pro"`:** Supabase sync proceeds with no limits. `hub_shared` stamped based on `hub.share_intelligence` setting.
- **If tier is `"team"` or `"enterprise"`:** Include team-scoped memory updates in the sync payload if `.agents/memory/` contains team-scoped entries. Hub-scoped pool entries included.
- **All tiers:** Local close (Steps 1-6) always completes regardless of sync outcome. Sync is a bonus, not a gate. Notion sync works for all tiers.

**hub_shared stamp** — determine once before building the session-end payload. Read live, never cache:
```
hub_shared = config.json > hub.share_intelligence === true
           AND config.json > license.tier !== "free"
hub_id     = hub_shared ? config.json > hub.id : omit
```
Apply `hub_shared` and `hub_id` to every memory_update entry in the session-end payload.

Check `config.json > sync.primary` to determine the sync target.

### If sync.primary = "supabase":

Call the Memory Layer API to close the server-side session and push all updates.

#### 7a. Read Active Session

Read `.mls/active_session.json` to get the session ID from the session-start API call.

- If the file doesn't exist or `session_id` is null → the session was never registered server-side. Skip to Notion sync (7f) or local-only path.
- If `local_only` is true → session-start failed, skip API call.

#### 7b. Build the Request Payload

Gather all the data the API needs:

```
POST {config.json > supabase.api_base}/session-end
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
X-MLS-Edge-Version: 1

{
  "api_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "session_id": "{from .mls/active_session.json}",
  "memory_updates": [
    // Any agent memory files that changed during the session.
    // Check .agents/memory/ for modified files. For each:
    // { "scope": "agent_project"|"agent_portable", "memory_type": "filename", "agent_name": "agent-name", "content": {...}, "tags": [] }
    // If no .agents/ directory or no changes, send empty array []
  ],
  "handoff": {
    "summary": "{Summary line from the changelog entry}",
    "for_next_agent": "{Full 'For Next Agent' section from changelog}",
    "pending_work": ["{Each bullet from For Next Agent as array items}"]
  },
  "metadata": {
    "tag": "{session tag — build, strategy, debug, etc.}",
    "goals_affected": ["{list of goal names that had progress}"]
  },
  "metrics": {
    "duration_minutes": "{calculated from started_at to now}",
    "context_entries": "{count from CONTEXT.md}",
    "tasks_completed": "{count of tasks completed this session}",
    "corrections_logged": "{count of new corrections this session}"
  },
  "rating": "{great|good|mixed|poor — from feedback collection, or null}",
  "feedback_comment": "{user comment from feedback, or null}",
  "corrections": [
    // NEW corrections logged this session only (not all active corrections)
    // { "correction": {"wrong": "...", "correct": "...", "context": "..."}, "scope": "project" }
  ]
}
```

#### 7c. Make the API Call

Execute the HTTP request using `curl` or the appropriate tool.

**On success (200):** The response contains:

```json
{
  "session": {
    "id": "uuid",
    "session_number": 7,
    "started_at": "ISO",
    "ended_at": "ISO",
    "duration_minutes": 45
  },
  "memory_entries_updated": 2,
  "memory_entries_created": 1,
  "corrections_added": 0,
  "sync_status": "success",
  "sync_errors": null
}
```

- If `sync_status` is `"success"` → proceed to confirmation
- If `sync_status` is `"partial"` → some updates failed. Log `sync_errors`, warn user, but continue
- If `sync_status` is `"failed"` → all updates failed. Log errors, continue with local files

**On error (non-200) or network failure:**
- Log the error
- Continue with session close — local files are already updated (Steps 1-6)
- Inform user: "API sync failed ([error]). Local context is saved. Will retry on next session."

#### 7d. Clean Up Active Session

Delete `.mls/active_session.json` after the API call (success or failure). The session is closed either way.

#### 7e. Confirm Supabase Sync

Tell the user: "Synced to Supabase — session closed, [N] memory entries synced, [N] corrections added."

### If sync.primary = "notion" OR Notion is configured as secondary:

Check `.mls/config.json` for `notion.projects_data_source_id`. If it's `null` or not set, skip to the "no sync" path below — Notion sync is optional.

**Notion sync steps:**

#### 7f. Update Properties

1. Search the Projects database for a row matching this project name.
2. If no row exists, create one. Save the page ID to `config.json > dashboard.notion_project_page_id`.
3. Update the row with ALL properties:

   **Core Identity:**
   - **Project Name** — from `config.json > project.name`
   - **Status** — "Active" (or "On Hold"/"Completed" if user indicated)
   - **Owner** — primary user (most sessions from metrics)
   - **Tier** — from `config.json > license.tier`
   - **MLS Version** — `"3.0.0"` from `config.json > mls_core_version`
   - **Tags** — infer from CONTEXT.md (see Tag Inference Rules in start skill)

   **Session Intelligence:**
   - **Last Handoff** — full "For Next Agent" section from latest CHANGELOG entry
   - **Active Task Count** — count of Active items in TASKS.md (number)
   - **Key Blockers** — from TASKS.md Blocked section (empty if none)
   - **Last Session Date** — today (`date:Last Session Date:start` = ISO date, `is_datetime` = 0)

   **Detail Fields:**
   - **Context** — CONTEXT.md content (condensed if over 2000 chars)
   - **Active Tasks** — Active and Up Next from TASKS.md
   - **Changelog** — most recent 3-5 entries from CHANGELOG.md
   - **Agent Notes** — same as Last Handoff

   **Metrics:**
   - **Session Count** — from metrics.json
   - **Time Saved (min)** — from metrics.json
   - **Users** — from metrics.json (comma-separated)
   - **Content Version** — increment by 1

   **Timestamps:**
   - **Last Synced** — current datetime (`date:Last Synced:start` = ISO datetime, `is_datetime` = 1)

#### 7g. Update Page Body

After updating properties, **replace the Notion page body** with the v3 format:

```markdown
> **MLS Core Project Page** — Automatically synced from local `.mls/` directory.
> **Version:** 3.0.0 | **Tier:** [tier] | **Last Synced:** [datetime]

---

# 🎯 For Next Agent

> **Read this first.** Direct handoff from the last session.

[Full "For Next Agent" section from latest CHANGELOG entry — verbatim, every bullet]

---

# 🏁 Goals

## Active
[Full Active Goals section from GOALS.md — with progress, statuses, and key tasks]

## Recently Completed
[Last 3 completed goals]

---

# 📋 Project Context

[Full CONTEXT.md content — all sections, unabridged]

---

# 🎛️ User Preferences

[Full PREFERENCES.md content]

---

# ✅ Tasks

[Full TASKS.md content — Active, Up Next, Blocked, Completed — all sections]

---

# 📓 Session Changelog (Last 15)

[15 most recent CHANGELOG.md entries — complete with tags, goals progress, summaries, and handoffs]

> Full changelog ([total] sessions) maintained locally in .mls/context/CHANGELOG.md

---

# 💬 Feedback & Self-Correction

## Behavioral Patterns
[FEEDBACK.md Patterns section]

## Recent Ratings
| Session | Tag | Rating | Comment |
|---|---|---|---|
| [most recent 10 entries] |

---

# 🔧 Corrections

## Active
[Active Corrections from CORRECTIONS.md]

## Recently Resolved
[Last 5 resolved corrections]

---

# 🤖 Agents
Agent configuration is managed by the Agentic Layer. See `.agents/` directory.

---

# 📊 Metrics

| Metric | Value |
|---|---|
| Sessions | [N] |
| Warm Starts | [N] |
| Time Saved | [X] min |
| Users | [list] |
| Avg Satisfaction | [rating] ([N] ratings) |
| Session Types | [breakdown] |
| Active Goals | [N] |
| Corrections | [N] active / [M] resolved |
| MLS Version | 3.0.0 |
| Tier | [tier] |
| Content Version | [N] |
| Last Synced | [datetime] |

---

# Cloud Sync Status

| Target | Status |
|---|---|
| Supabase | [Connected/Not configured] |
| Notion | [Connected/Not configured] |
| Community Brain | [Connected/Not configured] |
| Last Supabase Sync | [datetime or "N/A"] |
| Last Notion Sync | [datetime or "N/A"] |
```

**Self-heal on body write:** If `replace_content` fails, fall back to clearing the page and rewriting. If that also fails, log the error and continue — properties are already updated.

**Security note:** The Notion page body contains the full project context. Ensure the page access is set to 'Private' or 'Workspace only'. Never include raw API keys, passwords, or credentials in CONTEXT.md — they will be synced to Notion.

#### 7h. Confirm Sync

Tell the user: "Synced to Notion — properties and page content updated."

#### 7i. Sync to Community Brain

If `config.json > community_brain.enabled` is `true` and `community_brain.project_row_id` is not null:

1. **Update the project row** in the Community Brain Connected Projects database (data source ID from `config.json > community_brain.connected_projects_data_source_id`):
   - **Sessions** — from `metrics.json > sessions.total`
   - **Avg Rating** — from `metrics.json > feedback.avg_satisfaction`
   - **Top Tags** — top 3 tags by count from `metrics.json > session_tags` (as JSON array)
   - **Goals Completed** — from `metrics.json > goals.completed`
   - **Goals Active** — from `metrics.json > goals.active`
   - **Corrections** — from `metrics.json > corrections.total_logged`
   - **Patterns** — from `metrics.json > feedback.patterns_identified`
   - **Time Saved (hrs)** — estimated: `(sessions.total * 8) / 60` (8 min saved per session, converted to hours)
   - **Last Sync** — today's date

2. If the update succeeds, note in the close confirmation:
   > "Community Brain updated — your project stats are live on the leaderboard."

If Community Brain sync fails, continue. This is non-blocking.

### If sync.primary = "local" OR no sync configured:

Everything is local. No remote sync needed. Context files in `.mls/context/` are the source of truth.

---

## Step 8: Surface the Dashboard Link

**Mandatory after every session close.** Resolve the dashboard URL:

1. `config.json > dashboard.url` → use that
2. `config.json > dashboard.notion_project_page_id` → `https://www.notion.so/[page_id_without_dashes]`
3. Notion row just created in Step 7 → use that URL, save ID to config
4. None of the above → skip

---

## Step 9: Confirm Close

Keep it brief:

> "Session [N] closed. Handoff written: '[first line of For Next Agent]'. Context, tasks, and goals updated. [Feedback: [rating] recorded.] [If synced: 'Synced to [Supabase/Notion].'] [If community brain synced: 'Leaderboard updated.']"
>
> "Dashboard: [resolved dashboard URL]"
> [If community brain enabled] "Brain: https://www.notion.so/33733b46f2f281c8b1dcf5baa3f2cf0e"

Then the value summary:

> "MLS Core has saved you approximately [X] hours of context recovery across [N] sessions."

---

## What If the User Doesn't Explicitly Close?

If the conversation is winding down, prompt:

> "Before we wrap up, should I run the MLS Core session close? This saves your context, collects feedback, and writes the handoff for the next session."

Don't run it without asking. But do remind them.

---

## Dashboard Configuration Reference

```json
"dashboard": {
  "url": null,
  "fallback_to_notion": true,
  "notion_project_page_id": "[auto-populated]"
}
```

- **`url`** — Custom dashboard URL. Takes priority.
- **`fallback_to_notion`** — Fall back to Notion page when `url` is null.
- **`notion_project_page_id`** — Auto-populated on first sync.

---

## Error Recovery

| Problem | Recovery |
|---|---|
| CONTEXT.md deleted externally | Recreate from CHANGELOG.md history + this session's work |
| TASKS.md deleted externally | Recreate from this session's work |
| GOALS.md deleted externally | Recreate from template + any goals discussed this session |
| FEEDBACK.md deleted externally | Recreate from template. Patterns lost but will rebuild. |
| PREFERENCES.md deleted externally | Recreate from template. Preferences will rebuild from feedback. |
| CORRECTIONS.md deleted externally | Recreate from template. Log any corrections from this session. |
| metrics.json corrupted | Recreate with defaults. Infer from CHANGELOG entries |
| Sync module fails | Complete local close (steps 1-6). Inform user. Retry next session |
| CHANGELOG.md missing | Create with this session's entry. Note history loss |
| Dashboard link unresolvable | Complete close normally. Note no dashboard configured |
| Supabase SQL fails | Log error, continue local. Retry on next session. |
| Notion API fails on properties | Log error, skip to page body attempt. If body also fails, continue local |
| Notion page body write fails | Log error, continue — properties are already updated |
| config.json corrupted | Recreate from known project state. Warn user |
| .agents/ missing | Continue. Agent hooks are optional. |
| on_session_close.md fails | Log error, continue. Agent hooks never block close. |
| Feedback collection skipped by user | Log as skipped, continue. Never blocks close. |

**Principle: local close always succeeds.** Every step above the sync layer (Steps 1-6) must complete regardless of what happens with remote sync. Sync and dashboard are bonuses — Core's value (persistent context) works even when the remote layer is down.

---

## Important Rules

- **The handoff note is mandatory.** Every single close. No exceptions.
- **Never skip context updates.** The 2-3 minutes saves 8+ minutes next session.
- **Don't over-summarize.** Update files, write handoff, confirm, done.
- **Respect concurrent changes.** Check before pushing on Pro tier.
- **Always write the Notion page body, not just properties.** The body is the complete context layer.
- **Always surface the dashboard link.**
- **Always create the Notion row if missing.** No project invisible in Notion if IDs are configured.
- **Fire agent close hook before sync.** Agent hooks may update context/tasks.
- **Collect feedback without friction.** 1 click minimum. Never block close for it.
- **Log corrections proactively.** The user shouldn't have to ask — scan for them.
- **Update goals every session.** Even if progress is 0%, note that.
- **Tag every session.** Auto-infer, let user override.
- **Promote feedback patterns to preferences.** This is how the system learns permanently.
- **15 entries in Notion changelog.** Not 3-5. Deep history for remote agents.
- **Self-heal everything.** No corrupted file, missing directory, or API failure stops the close.
- **Supabase is primary when configured.** Check sync.primary first.
- **Notion is secondary or fallback.** Use when Supabase is not primary.
- **Agent hooks are optional and never blocking.** Graceful degradation always.
- **Tier never blocks close.** Local close (Steps 1-6) always completes. Sync failures are logged, not fatal. Licensing only affects which cloud features are available.
- **Sanitize error messages.** When logging API errors, include only: HTTP status code, error type, and a user-friendly message. Never display response bodies, stack traces, internal URLs, or the API key.
- **Never include secrets in context files.** If CONTEXT.md contains what looks like API keys or passwords, warn the user before syncing to Notion or Supabase.
- **MLS Core is proprietary software by Rabbithole LLC.** Redistribution or creation of derivative products is prohibited without written permission.
