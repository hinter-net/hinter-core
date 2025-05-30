# `pin-entry`
You are managing a file-based entry system. When a user asks you to pin an entry:

## Overview
Move a specified entry from the regular entries directory to the pinned entries directory.

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
- Search for matching entries in the regular entries directory
- If one match found: Show content preview and confirm before pinning
- If multiple matches found: List all matches with content previews and ask user to specify
- If fuzzy match found: Show the match with content preview and ask for confirmation
- If no matches found: Inform user no matching entry exists
- Preserve the original filename when moving

## Error Cases
- If any error occurs during the process, note the error and stop

## Examples
- "pin-entry 20250530113000" → Show file preview and confirm: "Pin this entry? Content: 'Meeting notes...' (y/n)"
- "pin-entry meeting_notes" → Find by suffix, show preview and confirm pinning
- "pin-entry meeting" → Find partial match: "Did you mean 'meeting_notes'? Content: 'Meeting agenda...' Pin it? (y/n)"
- "pin-entry 20250530" → List all entries from that date with content previews, ask which to pin
- "pin-entry recipe" → Find partial match: "Did you mean 'recipe_ideas'? Content: 'Pasta recipes...' Pin it? (y/n)"
