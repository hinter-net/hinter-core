# `pin-entry`

## Description
Moves a specified entry from the regular entries directory (`entries/`) to the pinned entries directory (`entries/pinned/`) after user confirmation. Pinned entries are typically given higher priority by AI processing.

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
        *   **Note**: The AI will search for matches only in the `entries/` (regular entries) directory.

## Core Logic / Procedure
1.  **Receive Identifier**: Obtain `{ENTRY_IDENTIFIER}` from the user.
2.  **Find Matching Entry in Regular Entries**:
    *   Scan all files only in the `entries/` directory.
    *   Filter these files based on `{ENTRY_IDENTIFIER}` (timestamp, suffix, fuzzy suffix).
    *   Store all found matches.
3.  **Handle Results**:
    *   **No Matches**: Trigger "No Regular Entry Found" error.
    *   **One Match**: Proceed to "Confirm Pinning" (Step 4).
    *   **Multiple Matches**: Trigger "Multiple Regular Entries Found" interaction (Step 5).
4.  **Confirm Pinning (Single Match)**:
    *   Let the matched file be `{FILENAME}` located at `entries/{FILENAME}`.
    *   Read the full content of `entries/{FILENAME}`.
    *   Generate a concise AI summary of the entry's content.
    *   Ask the user for explicit confirmation: "Pin this entry: `entries/{FILENAME}`? Summary: '{AI_SUMMARY}'. (yes/no)"
    *   If user confirms 'yes', move the file from `entries/{FILENAME}` to `entries/pinned/{FILENAME}`. Preserve the original filename.
    *   If move operation fails, trigger "File Move Failed" error.
    *   If successful, provide success output.
    *   If user responds with anything other than 'yes', abort the operation.
5.  **Handle Multiple Matches Found**:
    *   For each matching entry in `entries/`, read its content and generate an AI summary.
    *   List all matching entries with their filenames and AI summaries.
    *   Ask the user to specify which entry to pin by its filename.
    *   Once the user specifies a single entry, proceed to "Confirm Pinning" (Step 4) for that entry. If ambiguous or invalid, re-prompt or abort.

## User Interaction & Confirmation
*   **Mandatory Confirmation**: Pinning any file requires explicit user confirmation (e.g., 'yes') after an AI-generated summary is presented.
*   **Disambiguation**: If multiple entries match in `entries/`, the user must specify which one to pin.

## Success Output
*   "Successfully pinned entry: `entries/pinned/{FILENAME}` (moved from `entries/{FILENAME}`)."

## Error Handling & Responses
*   **No Regular Entry Found**: "Error: No entry found in `entries/` matching `{ENTRY_IDENTIFIER}`."
*   **Multiple Regular Entries Found (Initial Response)**: "Multiple entries match `{ENTRY_IDENTIFIER}` in `entries/`. Please specify which one to pin: \n1. `{FILENAME_1}` (Summary: `{AI_SUMMARY_1}`) \n2. `{FILENAME_2}` (Summary: `{AI_SUMMARY_2}`) \n..."
*   **File Move Failed**: "Error: Could not move entry `{FILENAME}` to `entries/pinned/`. Please check permissions."
*   **Summarization Failed**: "Error: Could not generate a summary for entry `{FILENAME}`. Cannot proceed with pinning without summarization."
*   **General Error**: "Error: An unexpected issue occurred while trying to pin the entry."

## Examples
*   **User**: `pin-entry 20250530113000_meeting_notes`
    *   **AI (Confirmation)**: "Pin this entry: `entries/20250530113000_meeting_notes.md`? Summary: 'Key discussion points from the project sync including action items...'. (yes/no)"
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully pinned entry: `entries/pinned/20250530113000_meeting_notes.md` (moved from `entries/20250530113000_meeting_notes.md`)."

## AI Learning
*   Not applicable for this command.

## Dependencies
*   Relies on `ai/tools/read-entries.sh` (or a similar mechanism) if AI summarization capability requires full content access beyond simple file listing.
*   Requires AI capability to generate concise summaries.
