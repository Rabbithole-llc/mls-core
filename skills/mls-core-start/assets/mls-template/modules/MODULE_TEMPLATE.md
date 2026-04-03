# Module Template

> This is a template for creating MLS Core modules. Copy this file, rename it to your module name (e.g., `sync-notion.md`), and fill in the sections below. Place the completed file in `.mls/modules/` for Core to discover it.

---

## Module Frontmatter

Every module MUST begin with this YAML frontmatter block:

```yaml
---
module_name: "Your Module Name"
module_type: sync | hub | agent | utility
module_version: "1.0.0"
requires_core: ">=1.0"
requires_tier: starter | pro | enterprise
description: "One-line description of what this module does"
status: active | disabled | error
author: "Your name or organization"
reads: ["CONTEXT.md", "TASKS.md", "CHANGELOG.md"]
writes: ["TASKS.md"]
depends_on: []
shares: []
---
```

### Field Definitions

- **module_name** — Human-readable name shown in the status display.
- **module_type** — One of: `sync` (remote synchronization), `hub` (multi-Core connector), `agent` (purpose-built worker), `utility` (helper tools).
- **module_version** — Semantic version of this module.
- **requires_core** — Minimum Core version needed. Use semver ranges.
- **requires_tier** — Minimum license tier required to use this module. Note: `sync` and `hub` module types require `pro` tier minimum.
- **description** — Shown in the session status display.
- **status** — `active` = running, `disabled` = installed but off, `error` = failed validation or runtime error.
- **author** — Creator of the module.
- **reads** — List of `.mls/context/` files this module reads. All modules can read all files, but declaring it makes dependencies explicit.
- **writes** — List of `.mls/context/` files this module writes to. Core enforces this — a module should not write to files it hasn't declared. Modules may only add or update content, never delete.
- **depends_on** — List of other module names this module requires to be installed and active. Core checks dependencies before loading.
- **shares** — List of files in the module's private storage that other modules may read.

## Module Body

After the frontmatter, the module body contains the instructions the agent follows when the module is invoked. Write this as you would write any agent protocol — clear, step-by-step instructions.

### Structure

```markdown
# [Module Name]

## Purpose
[What this module does and when it should be used]

## Triggers
[When this module activates — on command, on schedule, on session start, etc.]

## Protocol
[Step-by-step instructions for the agent]

## Error Handling
[What to do if something goes wrong]
```

## Module Storage

Modules that need to store their own state can create a subdirectory:

```
.mls/modules/[module-name]/
  [any files the module needs]
```

These files are private to the module. Other modules should not read or write them unless the module explicitly exposes them.

## Example: Minimal Agent Module

```yaml
---
module_name: "Daily Status Reporter"
module_type: agent
module_version: "1.0.0"
requires_core: ">=1.0"
requires_tier: starter
description: "Generates a daily status summary from tasks and changelog"
status: active
author: "Rabbithole LLC"
reads: ["CONTEXT.md", "TASKS.md", "CHANGELOG.md"]
writes: ["TASKS.md"]
---
```

```markdown
# Daily Status Reporter

## Purpose
Generates a concise status report of the project based on current tasks and recent changelog entries. Useful for team standups or personal check-ins.

## Triggers
- User says "status report", "daily status", "standup", or "what's happening"
- Can also be triggered at session start if configured

## Protocol
1. Read TASKS.md — count active, blocked, and recently completed tasks.
2. Read CHANGELOG.md — summarize the last 3 session entries.
3. Read CONTEXT.md — pull project name and key people.
4. Generate a status report in this format:
   - Project: [name]
   - Active tasks: [count] — [top 3 listed]
   - Blocked: [count] — [reasons]
   - Last 3 sessions: [1-line summary each]
   - Recommendation: [what to focus on next]

## Error Handling
If any context file is empty or missing, note it in the report and recommend the user run a context update.
```
