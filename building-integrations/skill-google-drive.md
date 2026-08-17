# Skill: Google Drive Integration

## What This Skill Does

Covers the full Google Drive integration lifecycle: how to guide a new user through setup correctly from the start, how to unlock full folder access without Picker friction, how to read and monitor shared folders, and how to handle outputs. Use this skill any time a user connects Google Drive or asks Runneth to work with Drive files or folders.

---

## Part 1: New User Setup Guide

When a user is setting up Google Drive for the first time, walk them through this sequence. Do not skip to technical commands before the folder is shared correctly or you will end up in a back-and-forth asking for individual file grants.

### Step 1: Connect the Google account

The user goes through a standard Google sign-in flow. Once connected, Runneth has access to their Google account but no Drive files yet.

### Step 2: Explain the Picker limitation upfront

After connecting, the default flow prompts the user to pick specific files through Google Picker. Picker only supports individual files, not folders. Before the user does anything in Picker, explain this clearly:

> "Picker only lets you grant individual files, which gets tedious fast. The better path is to share your creative folder with 'anyone with the link' in Drive. Once you do that, paste the folder URL here and I can browse the full folder, read everything inside, and monitor it for changes automatically."

This prevents the back-and-forth of individual file grants.

### Step 3: User shares their folder publicly

Have the user do this in Google Drive:
1. Right-click the folder
2. Click Share
3. Change access to "Anyone with the link"
4. Set the role to Viewer
5. Copy the link and paste it into the chat

Once the folder URL is in hand, use `google url list "<folder-url>"` to confirm access and show the user what Runneth can see.

### Step 4: Take a baseline snapshot and set up monitoring

After confirming access:
1. Traverse the full folder tree recursively using `google url list` on each subfolder
2. Save the full snapshot to `/agent/brain/drive-monitor/<folder-name>-snapshot.json`
3. Set up a daily reminder using `reminder add --cron "0 9 * * *" --timezone "<user-timezone>"` with instructions to diff against the saved snapshot and report changes
4. Tell the user what you found and that the daily check is running

### Step 5: Create a Runneth Workspace folder for outputs

Runneth cannot write into the user's existing Drive folders. Create an output folder at their Drive root:

```bash
google drive mkdir --name "Runneth Workspace"
```

Tell the user: anything Runneth generates (briefs, reports, exports) will be deposited here. They can find it in their Drive root.

---

## Part 2: How the Integration Actually Works

### What Runneth can do

- Browse and list any Drive folder shared with "anyone with the link," including all subfolders recursively
- Read file content: Docs, Sheets, text files
- Download assets: images, videos, PDFs (to `./workdir/`)
- Monitor a folder for new, modified, or removed files on a schedule
- Create new folders and files inside sandbox-managed folders (ones Runneth created)

### What Runneth cannot do

- Write into the user's existing Drive folders
- Modify files the user owns
- Access private folders (only "anyone with the link" folders work via `google url`)

### Why writes don't work

Runneth can only write to sandbox-managed folders (folders it created via `google drive mkdir`). Picker does not support folder grants, so there is no current path to giving Runneth edit access to an existing user folder. The Runneth Workspace workaround is the correct path for outputs.

---

## Part 3: Core Commands

### List a folder's contents
```bash
google url list "<folder-url>"
```
Returns all files and subfolders with `fileId`, `name`, `mimeType`, `modifiedDate`, and `capabilities`.

### Inspect a single file or folder
```bash
google url show "<file-or-folder-url>"
```

### Read a file's content (Docs, Sheets, text)
```bash
google url read "<file-url>" --format auto
```

### Download a file locally
```bash
google url download "<file-url>"
```

### Create a sandbox-managed output folder
```bash
google drive mkdir --name "<name>"
```
No `--parent` flag creates it at Drive root.

### Upload a file to a sandbox-managed folder
```bash
google drive upload --from ./workdir/<file> --name "<name>" --parent "<folder-id>"
```

---

## Part 4: Folder Monitoring Pattern

**Snapshot approach:**
1. Run `google url list` recursively across the full folder tree
2. Save the result to `/agent/brain/drive-monitor/<folder-name>-snapshot.json` with a `lastChecked` timestamp
3. On each scheduled check, run `google url list` again and compare against the saved snapshot
4. Report: new files (fileId not in snapshot), modified files (same fileId, newer modifiedDate), removed files (fileId in snapshot but not in current scan), new subfolders to recurse into
5. After reporting, update the snapshot and refresh `lastChecked`

**Routine setup:**
```bash
reminder add \
  --name "Drive monitor: <folder-name>" \
  --cron "0 9 * * *" \
  --timezone "<user-timezone>" \
  --content "<instructions referencing folder URLs and snapshot path>"
```

---

## Part 5: Capability Summary

| Capability | Supported |
|---|---|
| Browse/list public shared folders | Yes |
| Read file content (Docs, Sheets, text) | Yes |
| Download files (images, video, PDF) | Yes |
| Monitor for changes over time | Yes |
| Write files to Runneth Workspace | Yes |
| Write/edit files in user's existing folders | No |
| Access private (non-shared) folders | No |
