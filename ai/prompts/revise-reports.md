# `revise-reports`

## Description
Processes user-edited draft report candidates (located in `entries/` with filenames like `*_draft_report_for_*.md`). The AI analyzes the user's manual changes, incorporates them into the report's content, and updates the report's status to 'revised', ready for final approval before posting.

## Invocation / Arguments
*   **Invocation**: User typically says: `revise-reports [target_identifier]`
    *   Example: `revise-reports` (attempts to find and revise all drafts that appear edited since last AI touch)
    *   Example: `revise-reports alice` (finds and revises edited drafts for peer 'alice')
    *   Example: `revise-reports 20250530100000_draft_report_for_bob_itemX.md`
*   **Parameters**:
    *   `{TARGET_IDENTIFIER}` (optional):
        *   Can be a peer alias (e.g., `alice`) to revise all edited draft reports for that peer.
        *   Can be a specific draft report filename from `entries/`.
        *   If not provided, AI attempts to identify and revise all draft reports in `entries/` that have `<!-- STATUS: draft -->` and appear to have user modifications (e.g., based on file modification times if accessible, or by user explicitly stating they've edited drafts).

## Core Logic / Procedure
1.  **Identify Target Draft Reports for Revision**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get the content and metadata of all unpinned entries, specifically looking for draft reports.
    *   The generated file will be automatically available in your context without needing to explicitly read it.
    *   Filter these drafts based on `{TARGET_IDENTIFIER}`:
        *   If no identifier, select all drafts with `<!-- STATUS: draft -->`, `<!-- STATUS: revised -->`, or `<!-- STATUS: on_hold -->`. Do NOT process reports with `<!-- STATUS: denied -->`, `<!-- STATUS: approved -->`, or `<!-- STATUS: posted -->`. The AI might need to infer which of these have been user-edited (this could be challenging without file system metadata like modification times; alternatively, this command might primarily operate on explicitly named drafts or drafts for a specific peer as indicated by the user).
        *   If identifier is a peer alias, select drafts for that peer with `<!-- STATUS: draft -->`, `<!-- STATUS: revised -->`, or `<!-- STATUS: on_hold -->`.
        *   If identifier is a filename, select that specific draft (it must have `<!-- STATUS: draft -->`, `<!-- STATUS: revised -->`, or `<!-- STATUS: on_hold -->`).
    *   If no suitable draft reports are found (or none appear to need revision), trigger "No Drafts Found for Revision" error.
2.  **Process Each Targeted Draft Report**:
    *   For each selected draft report (let its filename be `{DRAFT_FILENAME}`):
        *   Read its current, user-edited content from `entries/{DRAFT_FILENAME}`.
        *   **Analyze User Edits**: Compare the current content against a previous version if available (this is complex; more simply, the AI should assume the current state reflects user's desired changes). Focus on interpreting any explicit comments (e.g., in `<!-- ... -->` blocks if the user adds them for the AI) or significant content changes (additions, deletions, rephrasing).
        *   **Apply Revisions**:
            *   Incorporate the user's changes into a clean version of the report content. This means if the user edited the main body, those edits are kept.
            *   If user added notes within the "User Feedback Section" of the draft, interpret these as instructions for revision (e.g., "Remove section X", "Rephrase Y to be more formal").
            *   The AI should intelligently merge user's direct edits with instructions from the feedback section.
            *   **Preserve Revision History**: In the "User Feedback Section", preserve all previous revision notes and add new ones. Use format: `<!-- REVISION N: User feedback: "[exact feedback]" -->` followed by `<!-- REVISION N INCORPORATED: [what was done] -->`. Do not overwrite previous revision history.
            *   Ensure the core information intended for the peer remains clear and accurate.
        *   **Update Metadata**: Change `<!-- STATUS: draft -->`, `<!-- STATUS: revised -->`, or `<!-- STATUS: on_hold -->` to `<!-- STATUS: revised -->` within the file content.
        *   Overwrite `entries/{DRAFT_FILENAME}` with the revised content and updated metadata. If save fails, trigger "File Save Failed" error.
3.  **Confirm Success**: After processing all targeted reports, provide a summary success output.

## User Edit Interpretation Guidelines for AI
*   Prioritize explicit instructions found in comments (e.g., `<!-- AI, please rephrase this part -->`).
*   Treat direct modifications to the report body as intentional changes to be preserved.
*   If user deletes a section, it should remain deleted.
*   If user adds new content, it should be included.
*   The "User Feedback Section" in the draft template is a key place for users to provide revision instructions.

## Success Output
*   "Successfully revised {N} draft report(s):
    *   `entries/{FILENAME_1}` (Status: revised)
    *   ... "
*   Include any errors for reports that failed.

## Error Handling & Responses
*   **No Drafts Found for Revision**: "Error: No draft reports found matching your criteria or needing revision."
*   **File Read Failed**: "Error: Could not read draft report `{DRAFT_FILENAME}`."
*   **File Save Failed**: "Error: Could not save revised report `{DRAFT_FILENAME}`."
*   **Unclear Revisions**: If user edits are highly contradictory or make the report's purpose unclear, the AI might revise to the best of its ability and add a comment: `<!-- AI NOTE: User edits were unclear in section X, attempted best interpretation. Please review. -->` or simply update status and rely on user to fix.
*   **Target Peer Not Found (from draft metadata, if checked)**: "Warning: Target peer for draft `{DRAFT_FILENAME}` seems invalid. Report revised, but please check peer details before posting."

## AI Learning
*   By observing the types of revisions users make repeatedly for certain peers or report types, the AI can improve its initial `draft-reports` generation to require less revision over time.
*   Patterns in user feedback notes can be learned to better understand user preferences.

## Dependencies
*   Relies on draft reports existing in `entries/` (typically from `draft-reports`).
*   Drafts should have `<!-- STATUS: draft -->` and other relevant metadata.
*   May use `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` to access draft report content.
