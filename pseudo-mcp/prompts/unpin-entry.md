# `unpin-entry` workflow
You are managing a file-based entry system. When a user asks you to unpin an entry:

## Overview
Move a specified entry from the pinned entries directory (`entries/pinned/`) to the regular entries directory (`entries/`).

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
- Search for matching entries in `entries/pinned/` directory using both exact and fuzzy matching
- If exactly one obvious match found: Move the file from `entries/pinned/` to `entries/`
- If multiple matches found: List all matches and ask user to specify which one
- If fuzzy match is unclear: Show the potential match and ask for confirmation
- If no matches found: Inform user no matching entry exists in pinned directory
- Preserve the original filename when moving

## Error Cases
- If directories don't exist, note this and stop
- If file move operation fails, note this and stop
- If entry is already in regular entries directory, inform user

## Examples
- User says "unpin-entry 20241129143022" → Move exact file
- User says "unpin-entry meeting_notes" → Move exact suffix match
- User says "unpin-entry meeting" → Find `meeting_notes.md`, confirm: "Did you mean 'meeting_notes'?"
- User says "unpin-entry 20241129" → Find all pinned files from that date, ask for clarification if multiple
- User says "unpin-entry priorities" → Find `priorities.md`, confirm: "Did you mean 'priorities'?"
