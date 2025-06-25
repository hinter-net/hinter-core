# `draft-reports`

## Description
Analyzes the user's personal entries to identify distinct pieces of valuable information, opportunities, or insights for specific peers. For each distinct item, a *separate* draft report candidate is created in the `entries/` directory for granular user review. The AI attempts to avoid re-drafting items for a peer if a similar draft already exists.

## Invocation / Arguments
*   **Invocation**: User typically says: `draft-reports [target_peer_alias] [focus_criteria]`
    *   Example: `draft-reports` (to draft for all known peers based on general relevance)
    *   Example: `draft-reports alice` (to draft only for peer 'alice')
    *   Example: `draft-reports bob project_phoenix_updates` (to draft for 'bob' focusing on 'project phoenix updates')
*   **Parameters**:
    *   `{TARGET_PEER_ALIAS}` (optional):
        *   The alias of a specific peer to draft reports for.
        *   If not provided, the AI attempts to draft reports for all known peers.
    *   `{FOCUS_CRITERIA}` (optional):
        *   Keywords to guide the AI on what type of information to focus on.
        *   If not provided, the AI uses general relevance.

## Core Logic / Procedure
1.  **Data Retrieval (User Entries & Existing Drafts)**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get all unpinned user entries (source material) AND existing draft reports (e.g., files matching `*_draft_report_for_*.md` in `entries/`).
    *   The generated file will be automatically available in your context without needing to explicitly read it.
    *   If `entries/` (excluding existing drafts) is empty, trigger "No Source Entries for Report Content" error.
2.  **Identify Target Peers**:
    *   List all peer directories from `peers/`.
    *   If `{TARGET_PEER_ALIAS}` is specified, filter to that peer. If not found, trigger "Target Peer Not Found" error.
    *   If no peers exist, trigger "No Peers Found" error.
3.  **Opportunity & Relevance Analysis (Per Peer)**:
    *   For each target peer:
        *   Analyze all user source entries to identify **distinct, self-contained pieces of information, insights, or opportunities** (hereafter "items") potentially relevant to this peer.
        *   Consider: peer's known interests, `{FOCUS_CRITERIA}`, potential for connection/collaboration, timeliness.
        *   Consult pinned entries for sharing rules/preferences.
        *   Filter out sensitive or "do not share" information.
4.  **Draft Report Candidate Creation (One per Distinct Item, Avoiding Duplicates)**:
    *   For each relevant distinct item identified for a peer:
        *   **Check for Existing Draft**: Scan the ingested existing draft reports for this peer. If a draft report for a highly similar item already exists (e.g., same core information, same source entries), *skip creating a new draft for this item*. This includes reports with ANY status (`draft`, `revised`, `approved`, `posted`, `on_hold`, `denied`). Pay special attention to reports with `<!-- STATUS: denied -->` - these represent poor quality attempts that should NOT be recreated. The definition of "highly similar" is up to AI judgment based on content and source.
        *   If no similar draft exists:
            *   Construct the filename: `YYYYMMDDHHMMSS_draft_report_for_[peer_alias]_[item_descriptor].md` using UTC time. `[item_descriptor]` should be a short, unique keyword/hash for the item (e.g., `_projX_update`, `_introY`).
            *   Use the "Report Candidate Format" below, focusing *only* on this single distinct item.
            *   Include metadata: target peer directory name, source entry filenames relevant to *this item*, creation timestamp, status (`draft`).
            *   Save to `entries/`. If creation fails, trigger "File Creation Failed" error for this report but continue.
5.  **Confirm Success**: After processing, provide a summary.

## Report Candidate Format (Template for a single distinct item)
```markdown
<!-- DRAFT REPORT FOR: [PeerAlias] -->
<!-- ITEM FOCUS: [Brief description of this specific item, e.g., "Project X Update", "Introduction to Contact Y"] -->
<!-- TARGET PEER DIR: [peer_alias-PUBLIC_KEY] -->
<!-- SOURCE ENTRIES: [List of YYYYMMDDHHMMSS.md source entry filenames relevant to THIS item] -->
<!-- CREATED: [YYYYMMDDHHMMSS of draft creation] -->
<!-- STATUS: draft -->

# Report for [PeerAlias] - Regarding: [Item Focus]

## Information / Opportunity / Insight
[Present the core information for THIS SPECIFIC ITEM. Be clear and concise, focusing only on this single piece of information or opportunity.]

## Context / Background
[Briefly provide any necessary context for this specific item.]

## Suggested Action / Next Steps
[Any suggested action related to this specific item.]

## User Feedback Section
<!--
    User, please review this draft for [Item Focus].
    - Is this information accurate and appropriate for [PeerAlias]?
    - Should anything be added, removed, or rephrased for this specific item?
-->
```

## Peer-Specific Customization & Privacy
*   For each drafted item, tailor content based on the peer's context and user's sharing preferences.
*   Adhere to sharing rules from pinned entries or learned feedback.

## Success Output
*   "Drafted {TotalN} new report candidate(s) for {NumPeers} peer(s):
    *   Peer `{PEER_ALIAS_1}`: {N1} report(s) (e.g., `entries/{FILENAME_A}`, `entries/{FILENAME_B}`)
    *   ..."
*   If items were skipped due to existing similar drafts: "Skipped drafting {S} items as similar drafts already exist."
*   If no new relevant items found: "No new draft reports created for {PEER_ALIAS_LIST} as no new sufficiently relevant distinct items were identified."

## Error Handling & Responses
*   **No Source Entries for Report Content**: "Error: No source entries found. Cannot draft reports."
*   **No Peers Found**: "Error: No peers found. Please add peers first."
*   **Target Peer Not Found**: "Error: Peer with alias `{TARGET_PEER_ALIAS}` not found."
*   **File Creation Failed**: "Error: Failed to save draft report `{FILENAME}`."

## AI Learning
*   Learn from user edits (via `revise-reports`) and approval/rejection of these granular drafts.
*   This refines identification of "distinct items" and "similarity" for duplicate checking.

## Dependencies
*   Relies on `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` for all entry content (source and existing drafts).
*   Requires AI capabilities for relevance assessment, information segmentation, similarity checking, and tailored content generation.
*   Interacts with `revise-reports` and `post-reports`.
