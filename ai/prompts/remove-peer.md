# `remove-peer`

## Description
Safely and permanently removes a peer's entire directory structure (`peers/{ALIAS}-{PUBLIC_KEY}/`), including their profile information (if any) and all associated incoming/outgoing reports, after explicit user confirmation.

## Invocation / Arguments
*   **Invocation**: User typically says: `remove-peer {PEER_IDENTIFIER}`
*   **Parameters**:
    *   `{PEER_IDENTIFIER}` (required):
        *   Identifies the peer to be removed. Can be:
            *   Full current directory name (e.g., `alice-4a6a3d8f...`).
            *   Current alias only (e.g., `alice`).
            *   Partial current public key (e.g., first 8 characters `4a6a3d8f`).
            *   Fuzzy matching on alias names is supported.

## Core Logic / Procedure
1.  **Identify Peer**:
    *   Obtain `{PEER_IDENTIFIER}` from the user.
    *   Scan `peers/` directory to find matching peer directory/directories.
    *   If no match, trigger "Peer Not Found" error.
    *   If multiple matches (e.g., due to fuzzy matching or partial identifier), list them and ask user to specify the exact one by its full directory name. Let this be `{PEER_DIR_TO_DELETE}`.
    *   If a single unique match is found, let it be `{PEER_DIR_TO_DELETE}`.
2.  **Gather Data Summary**:
    *   Extract `{ALIAS}` and `{PUBLIC_KEY}` from `{PEER_DIR_TO_DELETE}`.
    *   Count the number of files in `peers/{PEER_DIR_TO_DELETE}/incoming/` (if it exists).
    *   Count the number of files in `peers/{PEER_DIR_TO_DELETE}/outgoing/` (if it exists).
    *   Count any other files directly within `peers/{PEER_DIR_TO_DELETE}/` (e.g., `profile.yaml`).
3.  **User Confirmation**:
    *   Display the data summary:
        ```
        About to remove peer:
        - Directory: {PEER_DIR_TO_DELETE}
        - Alias: {ALIAS}
        - Public Key: {PUBLIC_KEY}
        - Incoming reports: {N_INCOMING} file(s)
        - Outgoing reports: {N_OUTGOING} file(s)
        - Other files: {N_OTHER} file(s) (e.g., profile)

        This action is permanent and cannot be undone.
        Are you sure you want to delete this peer and all associated data? (yes/no)
        ```
    *   If user does not confirm with 'yes', abort the operation.
4.  **Remove Peer Directory**:
    *   Recursively delete the entire directory `peers/{PEER_DIR_TO_DELETE}/`.
    *   If deletion fails, trigger "Directory Deletion Failed" error.
5.  **Confirm Success**: If deletion is successful, provide the success output.

## User Interaction & Confirmation
*   **Mandatory Confirmation**: Deletion requires explicit user confirmation (typing 'yes') after a detailed data summary is presented.
*   **Disambiguation**: If `{PEER_IDENTIFIER}` results in multiple matches, the user must specify the exact peer directory.

## Success Output
*   "Successfully removed peer `{ALIAS}`. Deleted directory `peers/{PEER_DIR_TO_DELETE}/` and all its contents."

## Error Handling & Responses
*   **Peer Not Found**: "Error: No peer found matching `{PEER_IDENTIFIER}`."
*   **Multiple Peers Found (Disambiguation)**: "Multiple peers match `{PEER_IDENTIFIER}`. Please specify the exact directory name to remove: \n1. `{DIR_1}` \n2. `{DIR_2}`..."
*   **Directory Deletion Failed**: "Error: Failed to delete peer directory `peers/{PEER_DIR_TO_DELETE}/`. Please check permissions or if files are in use."
*   **General Error**: "Error: An unexpected issue occurred while trying to remove the peer."

## Examples
*   **User**: `remove-peer alice` (assuming `alice-4a6a...` is the only match)
    *   **AI (Confirmation)**: (Shows data summary for `alice-4a6a...` and asks "Are you sure... (yes/no)")
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully removed peer `alice`. Deleted directory `peers/alice-4a6a.../` and all its contents."
*   **User**: `remove-peer oldpeer` (if multiple peers match "oldpeer")
    *   **AI (Disambiguation)**: "Multiple peers match `oldpeer`. Please specify...: \n1. `oldpeer_projectA-key1...` \n2. `oldpeer_archive-key2...`"

## AI Learning
*   Not applicable for this command.

## Dependencies
*   None.
