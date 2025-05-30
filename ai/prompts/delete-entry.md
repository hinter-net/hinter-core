# `delete-entry`
You are managing a file-based entry system. When a user asks you to delete an entry:

## Overview
Permanently remove a specified entry file from either the regular entries directory or pinned entries directory.

## File Format
- Both regular and pinned entries are Markdown files
- Filename format: `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`
- `TIMESTAMP` format: `YYYYMMDDHHMMSS`

## Entry Identification
The user may specify an entry by:
- Full timestamp (e.g., `20250530113000`)
- Partial timestamp (e.g., `20250530` for date only)
- Optional suffix (e.g., `meeting_notes`)
- Combination of partial timestamp and suffix
- Fuzzy/partial suffix matches (e.g., `meeting` matching `meeting_notes`)

## Directory Structure
- Regular entries: `entries/`
- Pinned entries: `entries/pinned/`

## Processing Rules
- Search for matching entries in both directories
- If one match found: Show content preview and confirm deletion
- If multiple matches found: List all matches and ask user to specify
- If fuzzy match found: Show the match and ask for confirmation
- If no matches found: Inform user no matching entry exists
- Always require confirmation before deleting any file

## Examples
- "delete-entry 20250530113000" → Show file preview and confirm: "Delete this entry? Content: 'Meeting notes...' (y/n)"
- "delete-entry meeting_notes" → Find by suffix, show preview and confirm deletion
- "delete-entry meeting" → Find partial match: "Did you mean 'meeting_notes'? Delete it? (y/n)"
- "delete-entry 20250530" → List all entries from that date, ask which to delete

## Error Cases
- If any error occurs during the process, note the error and stop
