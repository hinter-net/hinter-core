# `unpin-entry`
You are managing a file-based entry system. When a user asks you to unpin an entry:

## Overview
Move a specified entry from the pinned entries directory to the regular entries directory.

## File Format
- Both regular and pinned entries are Markdown files
- Filename format: `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`
- `TIMESTAMP` format: `YYYYMMDDHHMMSS`

## Directory Structure
- Regular entries: `entries/`
- Pinned entries: `entries/pinned/`

## Entry Identification
The user may specify an entry by:
- Full timestamp (e.g., `20250530113000`)
- Partial timestamp (e.g., `20250530` for date only)
- Optional suffix (e.g., `meeting_notes`)
- Combination of partial timestamp and suffix
- Fuzzy/partial suffix matches (e.g., `meeting` matching `meeting_notes`)

## Processing Rules
- Search for matching entries in the pinned entries directory
- If one match found: Show content preview and confirm before unpinning
- If multiple matches found: List all matches with content previews and ask user to specify
- If fuzzy match found: Show the match with content preview and ask for confirmation
- If no matches found: Inform user no matching entry exists in pinned directory
- Preserve the original filename when moving

## Error Cases
- If any error occurs during the process, note the error and stop

## Examples
- "unpin-entry 20250530113000" → Show file preview and confirm: "Unpin this entry? Content: 'Meeting notes...' (y/n)"
- "unpin-entry meeting_notes" → Find by suffix, show preview and confirm unpinning
- "unpin-entry meeting" → Find partial match: "Did you mean 'meeting_notes'? Content: 'Meeting agenda...' Unpin it? (y/n)"
- "unpin-entry 20250530" → List all pinned entries from that date with content previews, ask which to unpin
- "unpin-entry recipe" → Find partial match: "Did you mean 'recipe_ideas'? Content: 'Pasta recipes...' Unpin it? (y/n)"
