# `delete-entry` workflow
You are managing a file-based entry system. When a user asks you to delete an entry:

## Overview
Permanently remove a specified entry file from either the regular entries directory (`entries/`) or pinned entries directory (`entries/pinned/`).

## File Format
- Both regular and pinned entries are Markdown files
- Filename format: `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`
- `TIMESTAMP` format: `YYYYMMDDHHMMSS`

## Entry Identification
The user may specify an entry by:
- Full timestamp (e.g., `20241129143022`)
- Partial timestamp (e.g., `20241129` for date only)
- Optional suffix (e.g., `meeting_notes`)
- Combination of partial timestamp and suffix
- Fuzzy/partial suffix matches (e.g., `meeting` matching `meeting_notes`)

## Processing Rules
- Search for matching entries in both `entries/` and `entries/pinned/` directories using exact and fuzzy matching
- If exactly one obvious match found: Read the file content, show brief summary and ask for confirmation before deletion
- If multiple matches found: List all matches with brief content previews and ask user to specify which one
- If fuzzy match is unclear: Show the potential match with content preview and ask for confirmation
- If no matches found: Inform user no matching entry exists
- Always require explicit confirmation before deleting any file

## Error Cases
- If directories don't exist, note this and stop
- If file deletion operation fails, note this and stop
- If user cancels confirmation, acknowledge and stop

## Examples
- User says "delete 20241129143022" → Find exact file, show: "Delete '20241129143022_meeting_notes.md'? Content: 'Meeting with team about Q4 goals...' (y/n)"
- User says "delete meeting_notes" → Find exact suffix match, show content preview and confirm deletion
- User says "delete meeting" → Find `meeting_notes.md`, confirm: "Did you mean 'meeting_notes'? Content: 'Meeting with team...' Delete it? (y/n)"
- User says "delete 20241129" → Find all files from that date with content previews, ask user to specify which one