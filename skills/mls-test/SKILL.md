---
name: mls-test
description: "Check that MLS Core is working. Run /mls-test to validate your setup, files, and cloud connection."
---

# MLS Test — System Health Check

You validate that the MLS Core system and all installed agents are correctly configured and ready to use. Run this after installs, after errors, or any time the user wants confidence that things work.

---

## Validation Protocol

Run all checks below in order. For each, report PASS, WARN, or FAIL with a clear one-line explanation. At the end, summarize.

### 1. MLS Core Structure

| Check | How | PASS | FAIL |
|---|---|---|---|
| `.mls/` exists | Check directory | Directory found | "MLS Core not initialized. Run `/mls-core-start`." |
| `config.json` exists | Check file | File found | "Config missing. Run `/mls-core-start` to recreate." |
| `config.json` valid JSON | Parse file | Parses OK | "Config is corrupted. Back up and recreate from template." |
| `initialized: true` | Read field | True | "MLS Core started but not initialized. Run `/mls-core-start`." |
| `context/` exists | Check directory | Directory found | "Context directory missing. Creating..." (auto-fix) |
| `CONTEXT.md` exists | Check file | File found | WARN: "Context file missing. Will be created on next session." |
| `TASKS.md` exists | Check file | File found | WARN: "Tasks file missing. Will be created on next session." |
| `CHANGELOG.md` exists | Check file | File found | WARN: "Changelog missing. Will be created on next session." |
| `modules/` exists | Check directory | Directory found | "Modules directory missing. Creating..." (auto-fix) |
| `metrics.json` exists | Check file | File found | WARN: "Metrics missing. Will be recreated on next session start." |

### 2. Agent System Configuration

| Check | How | PASS | FAIL |
|---|---|---|---|
| `agents.enabled` is true | Read config | Enabled | WARN: "Agents are disabled. Set `agents.enabled: true` in config to use agents." |
| `trigger_dispatch_version` set | Read config | Version found | WARN: "No dispatch version. Adding '1.0.0'..." (auto-fix) |
| `installed_modules` is array | Read config | Valid array | "installed_modules is missing or corrupted in config." |
| No duplicate module entries | Check names | All unique | "Duplicate entry for [name] in installed_modules. Removing duplicate..." (auto-fix) |

### 3. Agent Module Integrity (per installed agent)

For each entry in `config.json > agents.installed_modules`:

| Check | How | PASS | FAIL |
|---|---|---|---|
| Module config exists | Check `.mls/modules/[file]` | File found | FAIL: "[Name] is in config but module file `.mls/modules/[file]` is missing." |
| YAML frontmatter parses | Parse YAML | Valid | FAIL: "[Name] module has invalid YAML frontmatter." |
| `skill_path` is set | Read YAML | Path found | FAIL: "[Name] module has no `skill_path`. Agents won't load behavioral instructions." |
| Skill file exists | Check `skill_path` | File found | FAIL: "[Name] skill file missing at [path]. Reinstall with `/mls-agents reinstall [name]`." |
| Memory directory exists | Check `.mls/modules/[name]/` | Directory found | WARN: "Memory directory missing for [Name]. Creating..." (auto-fix) |
| `status` is `active` | Read YAML | Active | INFO: "[Name] is `[status]` — won't be loaded by dispatch." |

### 4. Dependency Validation

For each module with `depends_on`:

| Check | How | PASS | FAIL |
|---|---|---|---|
| All dependencies installed | Cross-reference config | All found | FAIL: "[Name] depends on [dep] which is not installed." |
| No circular dependencies | Walk dependency graph | No cycles | FAIL: "Circular dependency: [A] → [B] → [A]. Break the cycle." |

For each hub module with `pipeline`:

| Check | How | PASS | FAIL |
|---|---|---|---|
| All pipeline modules exist | Cross-reference | All found | FAIL: "[Hub] pipeline references [module] which is not installed." |
| Pipeline modules are active | Check status | All active | WARN: "[Hub] pipeline includes [module] which is disabled." |

### 5. Config Consistency

| Check | How | PASS | FAIL |
|---|---|---|---|
| `max_concurrent` matches dispatch rules | Read config | Consistent | WARN: "`max_concurrent` is [N] but dispatch enforces one-at-a-time. Config value is informational only." |
| No orphaned module files | Scan `.mls/modules/*.md` vs config | All accounted for | WARN: "Module file [name].md exists but is not in config.json. Either add it or remove the file." |
| No orphaned skill directories | Scan `skills/` vs config | All accounted for | INFO: "Skill directory `skills/[name]/` exists but no module references it." |

### 6. Connection Tests (always run)

These are NOT optional anymore — run them every time.

**Supabase / Remote Sync:**
| Check | How | PASS | FAIL |
|---|---|---|---|
| `supabase.api_key` set | Read config | Key present | INFO: "Not connected to memorylayer.pro. Run `/mls-core-start` to connect." |
| `supabase.project_id` set | Read config | ID present | INFO: "No project ID configured. Run `/mls-core-start` to connect." |
| Supabase API reachable | POST to `{supabase.api_base}/health-check` with `{api_key, project_id}` | 200 OK | FAIL: "Cannot reach Supabase API. Check network or `supabase.api_base` in config." |
| Agent Marketplace reachable | `GET {supabase.api_base}/marketplace-agents?limit=1` | 200 OK | WARN: "Can't reach Agent Marketplace. Check network or try again later." |

**Community Brain:**
| Check | How | PASS | FAIL |
|---|---|---|---|
| `community_brain` block exists in config | Read config | Block found | INFO: "Community Brain not configured. Enabled by default for connected accounts." |
| `community_brain.enabled` is true | Read config | True | INFO: "Community Brain is disabled. Set to true in config to join." |
| Hub-brain endpoint reachable (if `community_brain.enabled`) | POST to `{supabase.api_base}/hub-brain` | 200 OK | WARN: "Hub Brain unreachable. Community intelligence unavailable this session." |

### 7. Feature Checks

| Check | How | PASS | FAIL |
|---|---|---|---|
| GOALS.md exists | Check file | Found | WARN: "Goals file missing. Will be created on next session." |
| PREFERENCES.md exists | Check file | Found | WARN: "Preferences file missing. Will be created on next session." |
| FEEDBACK.md exists | Check file | Found | WARN: "Feedback file missing. Will be created on next session." |
| CORRECTIONS.md exists | Check file | Found | WARN: "Corrections file missing. Will be created on next session." |
| preferences.feedback block in config | Read config | Found | WARN: "Feedback config missing. Adding defaults..." (auto-fix) |
| preferences.warm_start_enabled in config | Read config | Found | WARN: "Warm start config missing. Adding defaults..." (auto-fix) |
| community_brain block in config | Read config | Found | WARN: "Community Brain config missing. Adding defaults..." (auto-fix with `enabled:true, share_level:'anonymized_metrics'`) |

---

## Auto-Fix Protocol

When a check fails and auto-fix is available (marked above), fix it immediately and report:
> "Auto-fixed: Created missing memory directory for Content Creator."

For fixes that require user input (reinstall agent, fix YAML, reconnect memorylayer.pro), suggest the action:
> "To fix: run `/mls-agents reinstall content-creator`"

---

## Output Format

```
MLS Core Health Check
═══════════════════════════════════════

Core Structure .............. ✓ PASS (10/10)
Agent Configuration ......... ✓ PASS (4/4)
Module Integrity ............ ⚠ WARN (14/15 — 1 warning)
  └ Ad Manager: memory directory missing (auto-fixed)
Dependencies ................ ✓ PASS (2/2)
Config Consistency .......... ✓ PASS (3/3)
Connections ................. ✓ PASS (4/4)
  └ Supabase: connected
  └ Agent Marketplace: reachable
  └ Hub Brain: reachable
Features .................... ✓ PASS (7/7)

Overall: HEALTHY

🧠 Dashboard: https://memorylayer.pro/dashboard

Installed agents: 5 (4 agents, 1 hub)
  ✓ Social Media Manager
  ✓ Content Creator
  ✓ Ad Manager
  ✓ Workflow Creator
  ✓ Content Pipeline (hub → SMM → CC)
```

If any FAIL exists:
```
Overall: ACTION NEEDED (2 issues require attention)

  ✗ Content Creator skill file missing — reinstall with /mls-agents
  ✗ Content Pipeline depends on Content Creator which has errors
```

---

## When to Suggest Running This

Other skills should suggest `/mls-test` when:
- `/mls-agents` finishes an install or remove operation
- `mls-core-start` encounters unexpected errors during module discovery
- The user reports agents not activating or behaving unexpectedly
- After any manual file editing in `.mls/`

---

## License

MLS Core is proprietary software by Rabbithole LLC.
