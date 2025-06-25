# `delete-entry`

## Description
Permanently removes a specified entry file from either the `entries/` or `entries/pinned/` directory after user confirmation. Confirmation includes an AI-generated summary of the entry.

## Invocation / Arguments
*   **Invocation**: User typically says: `delete-entry {ENTRY_IDENTIFIER}`
*   **Parameters**:
    *   `{ENTRY_IDENTIFIER}` (required):
        *   A string used to identify the entry. Can be:
            *   Full timestamp (e.g., `20250530113000`).
            *   Partial timestamp (e.g., `20250530` for date, `202505` for month).
            *   An entry suffix (e.g., `meeting_notes`).
            *   A combination of partial timestamp and suffix.
            *   Keywords for fuzzy matching against suffixes or content.
        *   **Note**: The AI will search for matches in both `entries/` and `entries/pinned/`.

## Core Logic / Procedure
1.  **Receive Identifier**: Obtain `{ENTRY_IDENTIFIER}` from the user.
2.  **Find Matching Entries**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get all unpinned entries with their content. The generated file will be automatically available in your context without needing to explicitly read it.
    *   Filter these entries based on `{ENTRY_IDENTIFIER}`. This can involve:
        *   Exact timestamp match.
        *   Partial timestamp match (e.g., filename starts with the partial timestamp).
        *   Exact suffix match.
        *   Partial/fuzzy suffix match (e.g., filename contains the identifier).
        *   Content keyword match (analyzing the full content of each entry).
    *   Store all found matches, noting their full path, content, and whether they are pinned.
3.  **Handle Results**:
    *   **No Matches**: Trigger "No Entry Found" error.
    *   **One Match**: Proceed to "Confirm Deletion" (Step 4).
    *   **Multiple Matches**: Trigger "Multiple Entries Found" interaction (Step 5).
4.  **Confirm Deletion (Single Match)**:
    *   Read the full content of the matched entry.
    *   Generate a concise AI summary of the entry's content.
    *   Ask the user for explicit confirmation: "Delete this entry: `{FILENAME}`? Summary: '{AI_SUMMARY}'. (yes/no)"
    *   If user confirms with 'yes', delete the file. If any other response, abort.
    *   If deletion fails, trigger "File Deletion Failed" error.
    *   If successful, provide success output.
5.  **Handle Multiple Matches Found**:
    *   For each matching entry, read its full content and generate a concise AI summary.
    *   List all matching entries with their full filenames and their AI-generated summaries.
    *   Ask the user to specify which entry to delete by its full filename or a unique identifier from the list.
    *   Once the user specifies a single entry, proceed to "Confirm Deletion" (Step 4) for that entry. If the user's specification is ambiguous or invalid, re-prompt or abort.

## User Interaction & Confirmation
*   **Mandatory Confirmation**: Deletion of any file requires explicit user confirmation (e.g., typing 'yes') after an AI-generated summary of the entry is presented.
*   **Disambiguation**: If multiple entries match, the user must specify which one to delete based on filenames and AI summaries.

## Success Output
*   "Successfully deleted entry: `{FILENAME}`"

## Error Handling & Responses
*   **No Entry Found**: "Error: No entry found matching `{ENTRY_IDENTIFIER}`."
*   **Multiple Entries Found (Initial Response)**: "Multiple entries match `{ENTRY_IDENTIFIER}`. Please specify which one to delete from the following list: \n1. `{FILENAME_1}` (Summary: `{AI_SUMMARY_1}`) \n2. `{FILENAME_2}` (Summary: `{AI_SUMMARY_2}`) \n..."
*   **File Deletion Failed**: "Error: Could not delete entry `{FILENAME}`. Please check permissions."
*   **Summarization Failed**: "Error: Could not generate a summary for entry `{FILENAME}`. Cannot proceed with deletion without summarization."
*   **General Error**: "Error: An unexpected issue occurred while trying to delete the entry."

## Examples
*   **User**: `delete-entry 20250530113000`
    *   **AI (Confirmation)**: "Delete this entry: `entries/20250530113000.md`? Summary: 'This entry discusses the key outcomes of the Q2 budget meeting and action items for the next phase.'. (yes/no)"
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully deleted entry: `entries/20250530113000.md`"
*   **User**: `delete-entry 20250530` (assuming multiple matches)
    *   **AI (Disambiguation)**: "Multiple entries match `20250530`. Please specify which one to delete from the following list: \n1. `entries/20250530100000_project_alpha.md` (Summary: 'Contains updates on Project Alpha milestones and blocker issues.') \n2. `entries/pinned/20250530140000_strategy.md` (Summary: 'Outlines the strategic goals for Q3, focusing on market expansion and product development.')"

## AI Learning
*   Not applicable for this command.

## Dependencies
*   Relies on `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` to access the full content of entries for summarization.
*   Requires AI capability to generate concise summaries from text content.
