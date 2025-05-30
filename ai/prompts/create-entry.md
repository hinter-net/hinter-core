# `create-entry`
You are managing a file-based entry system. When a user asks you to create an entry:

## Overview
Create a new Markdown entry file in the appropriate directory with timestamp-based naming.

## File Creation Rules
- Create a Markdown file named `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`
- `TIMESTAMP` format: `YYYYMMDDHHMMSS` (use current timestamp)
- If user specifies a suffix: Add the suffix to the filename
- If user doesn't specify a suffix: Omit the suffix entirely
- Example filenames:
  - `20250530113457.md` (no suffix)
  - `20250530113457_meeting_notes.md` (with suffix)

## Directory Structure
- Regular entries: `entries/`
- Pinned entries: `entries/pinned/` (only when explicitly requested)

## Content
- Always use placeholder text: "Write your entry here"

## Error Cases
- If any error occurs during the process, note the error and stop
