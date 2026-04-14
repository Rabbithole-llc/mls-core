---
name: mls-upload
description: "Upload files to your memorylayer.pro project. Supports text files (.md, .txt, .csv, .json) and binary files (.xlsx, .pdf, .docx, images, etc.). Trigger on /mls-upload, 'upload file', 'upload this', 'save to project files', 'push this file', or 'sync file'."
---

# MLS Core V4.0.0 — Upload File

You upload files to the user's memorylayer.pro project so they appear in the project's Files tab on the dashboard. This is a standalone skill — it works at any point during a session, doesn't require a session close, and never blocks other work.

Supports **all file types**: text files (.md, .txt, .csv, .json, .html), binary files (.xlsx, .xls, .pdf, .docx, .pptx), images (.png, .jpg, .gif, .webp), archives (.zip), and more.

---

## Step 1: Read Connection Config

Read `.mls/config.json` from the workspace to get:
- `supabase.api_key`
- `supabase.project_id`
- `supabase.api_base`

If any of these are missing or null:
> "No memorylayer.pro connection found. Run /mls-core-start to connect."

Stop here.

---

## Step 2: Determine What to Upload

Accept one of four input types:

### A. File path the user specifies
- Read the file at the given path.
- Use the filename (basename) as the upload filename.
- If the file doesn't exist or can't be read, inform the user and stop.
- Detect whether the file is binary or text based on its extension (see Step 3).

### B. Content from conversation context
- If the user says "upload this" referring to content in the conversation (a code block, a document, etc.), capture that content as UTF-8 text.
- Ask the user for a filename:
  > "What should I name this file?"
- Use their answer as the filename.

### C. Bulk upload: "upload all context files"
- If the user says "upload all context files", "sync all context", or similar:
- Upload all 7 files from `.mls/context/`:
  1. CONTEXT.md
  2. TASKS.md
  3. CHANGELOG.md
  4. GOALS.md
  5. FEEDBACK.md
  6. PREFERENCES.md
  7. CORRECTIONS.md
- Use each file's actual filename.
- For description, use: "MLS Core context file — uploaded via /mls-upload"

### D. Binary file the user specifies
- If the file extension indicates a binary format (.xlsx, .xls, .pdf, .docx, .doc, .pptx, .ppt, .png, .jpg, .jpeg, .gif, .webp, .zip, .gz):
  - Read the file as base64 using the Bash tool: `base64 /path/to/file | tr -d '\n'`
  - Pass the result as `content` with `content_encoding: "base64"`
  - Set `content_type` to the correct MIME type for that extension (see MIME map below)

**MIME type map for binary files:**

| Extension | MIME type |
|---|---|
| .xlsx | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet |
| .xls  | application/vnd.ms-excel |
| .docx | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| .doc  | application/msword |
| .pptx | application/vnd.openxmlformats-officedocument.presentationml.presentation |
| .ppt  | application/vnd.ms-powerpoint |
| .pdf  | application/pdf |
| .png  | image/png |
| .jpg / .jpeg | image/jpeg |
| .gif  | image/gif |
| .webp | image/webp |
| .zip  | application/zip |
| .gz   | application/gzip |

---

## Step 3: Upload Each File

For each file to upload, call the upload endpoint with single-retry.

### Text file payload (UTF-8 content):
```
POST {config.json > supabase.api_base}/upload-file
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
X-MLS-Edge-Version: 1

{
  "account_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "filename": "the-filename.md",
  "content": "the file content as UTF-8 string",
  "session_id": "{from .mls/active_session.json if available, otherwise null}",
  "description": "optional — user-provided or auto-generated"
}
```

### Binary file payload (base64-encoded content):
```
POST {config.json > supabase.api_base}/upload-file
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdHFoeHVyZGJhZWF0c3Nvcmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxODE5MjEsImV4cCI6MjA5MDc1NzkyMX0.b2pW95mCli7Rwij10pGbcrlXP2QY9_lHtJiK2L1mgn4
X-MLS-Edge-Version: 1

{
  "account_key": "{config.json > supabase.api_key}",
  "project_id": "{config.json > supabase.project_id}",
  "filename": "Tracker.xlsx",
  "content": "<base64-encoded bytes from: base64 /path/to/file | tr -d '\\n'>",
  "content_encoding": "base64",
  "content_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "session_id": "{from .mls/active_session.json if available, otherwise null}",
  "description": "optional — user-provided or auto-generated"
}
```

**Retry protocol for each file:**
1. POST `{api_base}/upload-file` with the appropriate payload above
2. If the response is not 2xx OR the request times out:
   a. Wait 2 seconds
   b. Retry the same POST once
   c. If retry fails, report to user: "Upload failed for {filename} after retry. The endpoint may be temporarily unavailable."
3. If success on first or second attempt, confirm to user: "✓ {filename} uploaded"

### Session ID Resolution

Read `.mls/active_session.json`. If it exists and has a `session_id` field that is not null, use it. Otherwise pass `null`.

### Description

- If the user provided a description, use it.
- If uploading a single file with no description, auto-generate one: "Uploaded via /mls-upload during session [N]" (session number from metrics.json if available, otherwise omit).
- For bulk context uploads, use: "MLS Core context file — uploaded via /mls-upload"

---

## Step 4: Confirm Success

On success for each file:
> "Uploaded **[filename]** ([size in KB or bytes]) to your project. View at: https://memorylayer.pro/dashboard?project_id={project_id}&tab=files"

For bulk uploads, show a summary after all files:
> "Uploaded [N]/7 context files to your project.
> View at: https://memorylayer.pro/dashboard?project_id={project_id}&tab=files"

---

## Step 5: Handle Failures

On failure for any file:
> "Failed to upload [filename]: [error code] — [error message]. Try again with `/mls-upload`."

For bulk uploads, if some succeed and some fail:
> "Uploaded [N]/7 context files. [M] failed:
> - [filename]: [error]
> Retry failed uploads with `/mls-upload`."

---

## Behavior Rules

- **Fire-and-forget.** Upload, confirm, done. Never block other work.
- **No session required.** This skill works even if no session is active (session_id will be null).
- **Binary files need base64 encoding.** Always use `base64 /path/to/file | tr -d '\n'` to read binary files — never try to read them as text. Pass `content_encoding: "base64"` and `content_type` in the payload.
- **Text files send as-is.** .md, .txt, .csv, .json, .html, .xml, .yaml files are sent as UTF-8 strings without `content_encoding`.
- **Size awareness.** Warn the user before uploading if:
  - Text file: raw size > 100 KB
  - Binary file: raw file size > 75 KB (base64 encoding inflates ~33%, so 75 KB raw → ~100 KB encoded)
  > "This file is [size]. Large uploads may be slow. Proceed?"
- **Never upload secrets.** If the file content appears to contain API keys, passwords, or tokens (patterns like `sk-`, `ml_`, `AKIA`, `Bearer `, `password=`), warn the user:
  > "This file may contain sensitive credentials. Are you sure you want to upload it to the cloud?"
- **Sanitize error messages.** Never display raw API response bodies, stack traces, or the API key in error output. Status code + user-friendly message only.

---

## Error Recovery

| Problem | Recovery |
|---|---|
| No config.json | "Run /mls-core-start to set up MLS Core." |
| No api_key | "No memorylayer.pro connection. Run /mls-core-start to connect." |
| File not found | "File not found at [path]. Check the path and try again." |
| Binary read fails | "Couldn't read the file as base64. Make sure the file exists and is readable." |
| Network error | "Couldn't reach memorylayer.pro. Check your connection and retry." |
| 400 Bad Request | "Upload rejected — check that filename and content are both provided." |
| 401 Unauthorized | "Authentication failed. Your API key may be invalid — run /mls-core-start to reconnect." |
| 403 Forbidden | "Project not found or you don't have access to it." |
| 413 Payload Too Large | "File is too large for upload. Try splitting it into smaller files." |
| 500 Server error | "memorylayer.pro had a storage error. Try again in a few minutes." |

---

## Important Rules

- **This skill is standalone.** It does not depend on session state, session close, or any other skill.
- **Never modify the uploaded file locally.** This is a read-and-send operation.
- **Always confirm what was uploaded.** The user should know exactly what went to the cloud.
- **Respect user intent.** If they say "upload this file", upload that file. Don't upload extra files unless asked.
- **MLS Core is proprietary software by Rabbithole LLC.**
