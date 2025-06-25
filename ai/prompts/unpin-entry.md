# `unpin-entry`

## Description
Moves a specified entry from the pinned entries directory (`hinter-core-data/entries/pinned/`) to the regular entries directory (`hinter-core-data/entries/`) after user confirmation.

## Invocation / Arguments
*   **Invocation**: User typically says: `unpin-entry {ENTRY_IDENTIFIER}`
*   **Parameters**:
    *   `{ENTRY_IDENTIFIER}` (required):
        *   A string used to identify the entry to be unpinned. Can be:
            *   Full timestamp (e.g., `20250530113000`).
            *   Partial timestamp (e.g., `20250530` for date).
            *   An entry suffix (e.g., `meeting_notes`).
            *   A combination of partial timestamp and suffix.
            *   Keywords for fuzzy matching against suffixes.
        *   **Note**: The AI will search for matches only in the `hinter-core-data/entries/pinned/` directory.

## Core Logic / Procedure
1.  **Receive Identifier**: Obtain `{ENTRY_IDENTIFIER}` from the user.
2.  **Find Matching Entry in Pinned Entries**:
    *   The AI should already have all pinned entries in its context from startup. It will search this context.
    *   Filter these files based on `{ENTRY_IDENTIFIER}` (timestamp, suffix, fuzzy suffix).
    *   Store all found matches.
3.  **Handle Results**:
    *   **No Matches**: Trigger "No Pinned Entry Found" error.
    *   **One Match**: Proceed to "Confirm Unpinning" (Step 4).
    *   **Multiple Matches**: Trigger "Multiple Pinned Entries Found" interaction (Step 5).
4.  **Confirm Unpinning (Single Match)**:
    *   Let the matched file be `{FILENAME}` located at `hinter-core-data/entries/pinned/{FILENAME}`.
    *   Read the full content of `hinter-core-data/entries/pinned/{FILENAME}`.
    *   Generate a concise AI summary of the entry's content.
    *   Ask the user for explicit confirmation: "Unpin this entry: `hinter-core-data/entries/pinned/{FILENAME}`? Summary: '{AI_SUMMARY}'. (yes/no)"
    *   If user confirms 'yes', move the file from `hinter-core-data/entries/pinned/{FILENAME}` to `hinter-core-data/entries/{FILENAME}`. Preserve the original filename.
    *   If move operation fails, trigger "File Move Failed" error.
    *   If successful, provide success output.
    *   If user responds with anything other than 'yes', abort the operation.
5.  **Handle Multiple Matches Found**:
    *   For each matching entry in `hinter-core-data/entries/pinned/`, read its content and generate an AI summary.
    *   List all matching entries with their filenames and AI summaries.
    *   Ask the user to specify which entry to unpin by its filename.
    *   Once the user specifies a single entry, proceed to "Confirm Unpinning" (Step 4) for that entry. If ambiguous or invalid, re-prompt or abort.

## User Interaction & Confirmation
*   **Mandatory Confirmation**: Unpinning any file requires explicit user confirmation (e.g., 'yes') after an AI-generated summary is presented.
*   **Disambiguation**: If multiple entries match in `hinter-core-data/entries/pinned/`, the user must specify which one to unpin.

## Success Output
*   "Successfully unpinned entry: `hinter-core-data/entries/{FILENAME}` (moved from `hinter-core-data/entries/pinned/{FILENAME}`)."

## Error Handling & Responses
*   **No Pinned Entry Found**: "Error: No entry found in `hinter-core-data/entries/pinned/` matching `{ENTRY_IDENTIFIER}`."
*   **Multiple Pinned Entries Found (Initial Response)**: "Multiple entries match `{ENTRY_IDENTIFIER}` in `hinter-core-data/entries/pinned/`. Please specify which one to unpin: \n1. `{FILENAME_1}` (Summary: `{AI_SUMMARY_1}`) \n2. `{FILENAME_2}` (Summary: `{AI_SUMMARY_2}`) \n..."
*   **File Move Failed**: "Error: Could not move entry `{FILENAME}` to `hinter-core-data/entries/`. Please check permissions."
*   **Summarization Failed**: "Error: Could not generate a summary for entry `{FILENAME}`. Cannot proceed with unpinning without summarization."
*   **General Error**: "Error: An unexpected issue occurred while trying to unpin the entry."

## Examples
*   **User**: `unpin-entry 20250530113000_important_strategy`
    *   **AI (Confirmation)**: "Unpin this entry: `hinter-core-data/entries/pinned/20250530113000_important_strategy.md`? Summary: 'Outlines the Q3 marketing plan and budget allocations...'. (yes/no)"
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully unpinned entry: `hinter-core-data/entries/20250530113000_important_strategy.md` (moved from `hinter-core-data/entries/pinned/20250530113000_important_strategy.md`)."

## AI Learning
*   Not applicable for this command.

## Dependencies
*   Relies on `ai/tools/echo-entries.sh` piped to `.clinerules/pinned-entries.md` if AI summarization capability requires full content access beyond simple file listing.
*   Requires AI capability to generate concise summaries.
