# `find-entry`
You are managing a file-based entry system. When a user asks you to find an entry:

## Overview
Search for entries matching specified criteria (timestamp, suffix, or content) and display matching entries with their details.

## Search Criteria
The user may specify search criteria by:
- Full timestamp (e.g., `20250530113000`)
- Partial timestamp (e.g., `20250530` for date only, or `202505` for month only)
- Suffix (e.g., `meeting_notes`)
- Content keywords (e.g., `project update`)
- Any combination of the above

## Search Process
1. Execute the `ai/tools/read-entries.sh` script to get a list of all entries
2. Ingest the COMPLETE output into your context (do NOT use grep or other command-line tools to filter)
3. Within your context, analyze each entry and determine if it matches the search criteria
4. For fuzzy matches, use your best judgment to determine relevance

## Results Display
- If one match found: Show the complete entry details (filename, pinned status, and content)
- If multiple matches found: List all matches with their details
- If no matches found: Inform the user no matching entries exist

## Examples
- "find-entry 20250530113000" → Find entry with exact timestamp
- "find-entry 20250530" → Find entries from May 30, 2025
- "find-entry meeting" → Find entries with "meeting" in the filename or content
- "find-entry project update" → Find entries containing "project update" in the content
- "find-entry 202505 report" → Find entries from May 2025 with "report" in the filename or content

## Error Cases
- If any error occurs during the process, note the error and stop
