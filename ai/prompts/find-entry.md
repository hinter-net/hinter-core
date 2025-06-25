# `find-entry`

## Description
Searches for entries in `entries/` and `entries/pinned/` matching specified criteria (timestamp, suffix, or content keywords) and displays the details of matching entries.

## Invocation / Arguments
*   **Invocation**: User typically says: `find-entry {SEARCH_CRITERIA}`
    *   Example: `find-entry 20250530`
    *   Example: `find-entry meeting_notes project_alpha`
    *   Example: `find-entry "critical update"` (if searching for a phrase in content)
*   **Parameters**:
    *   `{SEARCH_CRITERIA}` (required):
        *   One or more terms to search for. Can include:
            *   Full timestamp (e.g., `20250530113000`).
            *   Partial timestamp (e.g., `20250530` for date, `202505` for month).
            *   Entry suffix (e.g., `meeting_notes`).
            *   Content keywords or phrases.
        *   The AI will attempt to match these criteria against filenames and entry content.

## Core Logic / Procedure
1.  **Receive Search Criteria**: Obtain `{SEARCH_CRITERIA}` from the user.
2.  **Data Retrieval**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get the full content of all unpinned entries from `entries/`.
    *   The generated file will be automatically available in your context without needing to explicitly read it.
3.  **Filter Entries**:
    *   For each entry in the ingested data:
        *   Check if its filename (timestamp or suffix part) matches any part of `{SEARCH_CRITERIA}`. This can be exact or partial/fuzzy.
        *   Check if its content (as provided by `echo-entries.sh`) contains keywords or phrases from `{SEARCH_CRITERIA}`.
        *   An entry is considered a match if any of its attributes (filename, content) align with the search criteria. The AI should use its judgment for relevance in fuzzy matches.
    *   Collect all matching entries.
4.  **Display Results**:
    *   If no entries match, trigger "No Matches Found" error.
    *   If one or more entries match, display each matching entry's details:
        *   Full filename.
        *   Pinned status (i.e., if it's from `entries/pinned/`).
        *   Full content of the entry.
        *   If many entries match, consider asking the user if they want to see all or a subset, or suggest refining criteria. (For now, display all).

## User Interaction & Confirmation
*   This command typically does not require intermediate confirmation beyond the initial invocation.

## Success Output
*   If matches are found, the output is the direct display of the matching entries. For example:
    ```
    Found {N} matching entries:

    ---
    File: entries/20250530113000_meeting_notes.md
    Pinned: No
    Content:
    [Full content of the entry...]
    ---
    File: entries/pinned/20250529100000_important_idea.md
    Pinned: Yes
    Content:
    [Full content of the entry...]
    ---
    ... (more entries if found)
    ```

## Error Handling & Responses
*   **No Matches Found**: "No entries found matching your criteria: `{SEARCH_CRITERIA}`."
*   **Read Entries Failed**: "Error: Could not read entries. Please check the `echo-entries.sh` script or data directory."
*   **General Error**: "Error: An unexpected issue occurred while trying to find entries."

## Examples
*   **User**: `find-entry 20250530113000`
    *   **AI (Success)**: (Displays the entry `entries/20250530113000.md` if it exists)
*   **User**: `find-entry meeting project_alpha`
    *   **AI (Success)**: (Displays all entries containing "meeting" or "project_alpha" in filename or content)
*   **User**: `find-entry non_existent_term`
    *   **AI (Error)**: "No entries found matching your criteria: `non_existent_term`."

## AI Learning
*   Not directly applicable for learning, but observing frequent search patterns might inform future AI proactive suggestions (outside this specific command).

## Dependencies
*   Relies heavily on `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` to access the full content of all user entries for searching.
