# `post-reports`

## Description
Moves finalized and approved draft report candidates from the `entries/` directory to the appropriate peer outgoing directories (`peers/{ALIAS}-{PUBLIC_KEY}/outgoing/`) for P2P distribution. This involves cleaning the report content of internal metadata/comments and updating the status of the original draft.

## Invocation / Arguments
*   **Invocation**: User typically says: `post-reports [target_identifier]`
    *   Example: `post-reports` (attempts to post all reports marked as 'approved')
    *   Example: `post-reports alice` (posts approved reports for peer 'alice')
    *   Example: `post-reports 20250530100000_draft_report_for_bob_itemX.md` (posts a specific approved draft)
*   **Parameters**:
    *   `{TARGET_IDENTIFIER}` (optional):
        *   Can be a peer alias (e.g., `alice`) to post all approved reports for that peer.
        *   Can be a specific draft report filename from `entries/` (e.g., `YYYY..._draft_report_for_...md`).
        *   If not provided, AI considers all draft reports in `entries/` with an 'approved' status.

## Core Logic / Procedure
1.  **Identify Target Draft Reports**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get the content and metadata of all unpinned entries, specifically looking for draft reports (e.g., files named `*_draft_report_for_*.md` or identified by metadata).
    *   The generated file will be automatically available in your context without needing to explicitly read it.
    *   Filter these drafts based on `{TARGET_IDENTIFIER}`:
        *   If no identifier, select all drafts with `<!-- STATUS: approved -->` ONLY. Do not consider drafts with any other status (`draft`, `revised`, `on_hold`, `denied`, `posted`).
        *   If identifier is a peer alias, select approved drafts where `<!-- DRAFT REPORT FOR: [alias] -->` or `<!-- TARGET PEER DIR: [alias-...] -->` matches.
        *   If identifier is a filename, select that specific draft (it must also have `<!-- STATUS: approved -->`).
    *   If no suitable approved drafts are found, trigger "No Approved Reports Found" error.
2.  **User Confirmation (Pre-Posting Summary)**:
    *   For each selected draft report, extract its target peer alias and item focus/summary from its metadata.
    *   Present a list to the user: "About to post {N} report(s): \n - Report 1 (Focus: '{ITEM_FOCUS_1}') for Peer '{PEER_ALIAS_1}' \n - Report 2 (Focus: '{ITEM_FOCUS_2}') for Peer '{PEER_ALIAS_2}' \n ... Continue? (yes/no)".
    *   If user does not confirm with 'yes', abort.
3.  **Process Each Approved Report for Posting**:
    *   For each draft report confirmed by the user:
        *   Let the draft filename in `entries/` be `{DRAFT_FILENAME}`.
        *   Extract the target peer directory name (e.g., `{PEER_ALIAS}-{PUBLIC_KEY}`) from the draft's `<!-- TARGET PEER DIR: ... -->` metadata.
        *   Verify the target peer directory `peers/{PEER_ALIAS}-{PUBLIC_KEY}/outgoing/` exists. If not, create it. If creation fails, trigger "Outgoing Directory Creation Failed" error for this report and skip it.
        *   **Finalize Report Content**: Read the full content of `{DRAFT_FILENAME}`. Remove ALL `<!-- ... -->` style comments (including status, target peer, source entries, item focus, and the user feedback section). The goal is a clean, peer-facing document.
        *   Generate a new UTC timestamp for the final report filename: `YYYYMMDDHHMMSS.md`. If multiple reports are being posted to the same peer in the same second, append a small unique suffix like `_1`, `_2` to the timestamp part of the filename (e.g., `YYYYMMDDHHMMSS_1.md`) to ensure uniqueness in the `outgoing/` directory.
        *   Construct the final path: `peers/{PEER_ALIAS}-{PUBLIC_KEY}/outgoing/{FINAL_REPORT_FILENAME}`.
        *   Write the cleaned content to this final path. If write fails, trigger "File Write Failed" error for this report and skip it.
        *   **Update Draft Status**: Modify the original draft report `{DRAFT_FILENAME}` in `entries/`. Change its `<!-- STATUS: approved -->` metadata tag to `<!-- STATUS: posted -->`. Add a new metadata tag: `<!-- POSTED_AS: peers/{PEER_ALIAS}-{PUBLIC_KEY}/outgoing/{FINAL_REPORT_FILENAME} -->`. If this update fails, log a warning but consider the report successfully posted if the file was written to `outgoing/`.
4.  **Confirm Success (Post-Posting Summary)**:
    *   Provide a summary of successfully posted reports and any errors encountered during the process.

## Final Report Content Guidelines
*   The content written to the `outgoing/` directory must be only the information intended for the peer.
*   All HTML-style comments (`<!-- ... -->`) used for metadata, status, or user feedback in the draft must be stripped out.

## Success Output
*   "Successfully posted {N} report(s):
    *   `{FINAL_REPORT_PATH_1}` for peer `{PEER_ALIAS_1}` (from draft `{DRAFT_FILENAME_1}`)
    *   ... "
*   Include any errors for reports that failed to post or whose drafts couldn't be updated.

## Error Handling & Responses
*   **No Approved Reports Found**: "Error: No approved draft reports found matching your criteria." (Suggest checking draft statuses or running `revise-reports`).
*   **Target Peer Not Found (from draft metadata)**: "Error: Target peer directory `{PEER_DIR_FROM_METADATA}` specified in draft `{DRAFT_FILENAME}` does not exist. Skipping this report."
*   **Outgoing Directory Creation Failed**: "Error: Could not create `outgoing/` directory for peer `{PEER_ALIAS}`. Skipping reports for this peer."
*   **File Write Failed**: "Error: Failed to write final report to `{FINAL_REPORT_PATH}`. Skipping this report."
*   **Draft Status Update Failed**: "Warning: Posted report `{FINAL_REPORT_PATH}`, but failed to update status of original draft `{DRAFT_FILENAME}`."

## AI Learning
*   Observing which reports are consistently approved and posted can provide implicit feedback on the quality of the `draft-reports` and `revise-reports` workflows.

## Dependencies
*   Relies on draft reports existing in `entries/` (typically created by `draft-reports` and refined by `revise-reports`).
*   Draft reports must contain `<!-- STATUS: approved -->` and `<!-- TARGET PEER DIR: ... -->` metadata.
*   May use `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` to efficiently access draft report content and metadata.
