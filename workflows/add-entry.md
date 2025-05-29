# `add-entry` workflow
You are managing a file-based entry system. When a user asks you to add an entry:

## Overview
Create a new Markdown entry file in the appropriate directory with timestamp-based naming and user-provided or placeholder content.

## File Creation Rules
- Create a Markdown file named `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`
- `TIMESTAMP` format: `YYYYMMDDHHMMSS` (use current timestamp)
- If user specifies a suffix: Use their suffix
- If user provides content but no suffix: Create a brief descriptive suffix based on the content
- If user provides no content and no suffix: Omit the suffix entirely
- Example filenames:
 - `20241129143022.md` (no content, no suffix)
 - `20241129143022_meeting_notes.md` (user-specified suffix)
 - `20241129143022_recipe_ideas.md` (auto-generated suffix from content)

## Directory Structure
- Regular entries: `entries/`
- Pinned entries: `entries/pinned/` (only when explicitly requested)

## Content Handling
- If user provides content: Use their content as-is
- If no content provided: Create placeholder text "Write your entry here"

## Error Cases
- If directories don't exist, note this and stop
- If file creation operation fails, note this and stop