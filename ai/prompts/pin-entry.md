# `pin-entry`

## Description
Moves a specified entry from the regular entries directory (`hinter-core-data/entries/`) to the pinned entries directory (`hinter-core-data/entries/pinned/`) after user confirmation. Pinned entries are typically given higher priority by AI processing.

## Invocation / Arguments
*   **Invocation**: User typically says: `pin-entry {ENTRY_IDENTIFIER}`
*   **Parameters**:
    *   `{ENTRY_IDENTIFIER}` (required):
        *   A string used to identify the entry to be pinned. Can be:
            *   Full timestamp (e.g., `20250530113000`).
            *   Partial timestamp (e.g., `20250530` for date).
            *   An entry suffix (e.g., `meeting_notes`).
            *   A combination of partial timestamp and suffix.
            *   Keywords for fuzzy matching against suffixes.
        *   **Note**: The AI will search for matches only in the `hinter-core-data/entries/` (regular entries) directory.

## Core Logic / Procedure
1.  **Receive Identifier**: Obtain `{ENTRY_IDENTIFIER}` from the user.
2.  **Find Matching Entry in Regular Entries**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get all unpinned entries. The generated file will be automatically available in your context without needing to explicitly read it.
    *   Filter these files based on `{ENTRY_IDENTIFIER}` (timestamp, suffix, fuzzy suffix).
    *   Store all found matches.
3.  **Handle Results**:
    *   **No Matches**: Trigger "No Regular Entry Found" error.
    *   **One Match**: Proceed to "Confirm Pinning" (Step 4).
    *   **Multiple Matches**: Trigger "Multiple Regular Entries Found" interaction (Step 5).
4.  **Confirm Pinning (Single Match)**:
    *   Let the matched file be `{FILENAME}` located at `hinter-core-data/entries/{FILENAME}`.
    *   Read the full content of `hinter-core-data/entries/{FILENAME}`.
    *   Generate a concise AI summary of the entry's content.
    *   Ask the user for explicit confirmation: "Pin this entry: `hinter-core-data/entries/{FILENAME}`? Summary: '{AI_SUMMARY}'. (yes/no)"
    *   If user confirms 'yes', move the file from `hinter-core-data/entries/{FILENAME}` to `hinter-core-data/entries/pinned/{FILENAME}`. Preserve the original filename.
    *   If move operation fails, trigger "File Move Failed" error.
    *   If successful, provide success output.
    *   If user responds with anything other than 'yes', abort the operation.
5.  **Handle Multiple Matches Found**:
    *   For each matching entry in `hinter-core-data/entries/`, read its content and generate an AI summary.
    *   List all matching entries with their filenames and AI summaries.
    *   Ask the user to specify which entry to pin by its filename.
    *   Once the user specifies a single entry, proceed to "Confirm Pinning" (Step 4) for that entry. If ambiguous or invalid, re-prompt or abort.

## User Interaction & Confirmation
*   **Mandatory Confirmation**: Pinning any file requires explicit user confirmation (e.g., 'yes') after an AI-generated summary is presented.
*   **Disambiguation**: If multiple entries match in `entries/`, the user must specify which one to pin.

## Success Output
*   "Successfully pinned entry: `hinter-core-data/entries/pinned/{FILENAME}` (moved from `hinter-core-data/entries/{FILENAME}`)."

## Error Handling & Responses
*   **No Regular Entry Found**: "Error: No entry found in `hinter-core-data/entries/` matching `{ENTRY_IDENTIFIER}`."
*   **Multiple Regular Entries Found (Initial Response)**: "Multiple entries match `{ENTRY_IDENTIFIER}` in `hinter-core-data/entries/`. Please specify which one to pin: \n1. `{FILENAME_1}` (Summary: `{AI_SUMMARY_1}`) \n2. `{FILENAME_2}` (Summary: `{AI_SUMMARY_2}`) \n..."
*   **File Move Failed**: "Error: Could not move entry `{FILENAME}` to `hinter-core-data/entries/pinned/`. Please check permissions."
*   **Summarization Failed**: "Error: Could not generate a summary for entry `{FILENAME}`. Cannot proceed with pinning without summarization."
*   **General Error**: "Error: An unexpected issue occurred while trying to pin the entry."

## Examples
*   **User**: `pin-entry 20250530113000_meeting_notes`
    *   **AI (Confirmation)**: "Pin this entry: `hinter-core-data/entries/20250530113000_meeting_notes.md`? Summary: 'Key discussion points from the project sync including action items...'. (yes/no)"
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully pinned entry: `hinter-core-data/entries/pinned/20250530113000_meeting_notes.md` (moved from `hinter-core-data/entries/20250530113000_meeting_notes.md`)."

## AI Learning
*   Not applicable for this command.

## Dependencies
*   Relies on `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` if AI summarization capability requires full content access beyond simple file listing.
*   Requires AI capability to generate concise summaries.
