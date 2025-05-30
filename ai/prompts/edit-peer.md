# `edit-peer`

## Description
Modifies an existing peer's alias or public key. This operation involves renaming the peer's main directory (`peers/{ALIAS}-{PUBLIC_KEY}/`).

## Invocation / Arguments
*   **Invocation**: User typically says: `edit-peer {PEER_IDENTIFIER} [new_alias {NEW_ALIAS} | new_key {NEW_PUBLIC_KEY}]`
    *   Example: `edit-peer alice new_alias alicesmith`
    *   Example: `edit-peer 4a6a3d8f new_key 5b7e8d9c...` (assuming `4a6a3d8f` uniquely identifies a peer)
    *   If only `{PEER_IDENTIFIER}` is given, the AI should prompt whether to change the alias or public key.
*   **Parameters**:
    *   `{PEER_IDENTIFIER}` (required):
        *   Identifies the peer to edit. Can be:
            *   Full current directory name (e.g., `alice-4a6a3d8f...`).
            *   Current alias only (e.g., `alice`).
            *   Partial current public key (e.g., first 8 characters `4a6a3d8f`).
            *   Fuzzy matching on alias names is supported.
    *   `new_alias {NEW_ALIAS}` (optional, mutually exclusive with `new_key`):
        *   Specifies the new alias for the peer.
        *   **Validation**: `{NEW_ALIAS}` must NOT contain the `-` (hyphen) character.
    *   `new_key {NEW_PUBLIC_KEY}` (optional, mutually exclusive with `new_alias`):
        *   Specifies the new 64-character public key.
        *   **Validation**: `{NEW_PUBLIC_KEY}` must be exactly 64 lowercase hexadecimal characters.

## Core Logic / Procedure
1.  **Identify Peer**:
    *   Obtain `{PEER_IDENTIFIER}` from the user.
    *   Scan `peers/` directory to find matching peer(s).
    *   If no match, trigger "Peer Not Found" error.
    *   If multiple matches, list them and ask user to specify one.
    *   Let the uniquely identified peer directory be `{OLD_ALIAS}-{OLD_PUBLIC_KEY}`.
2.  **Determine Edit Type**:
    *   If `new_alias {NEW_ALIAS}` is provided: Edit type is ALIAS.
    *   If `new_key {NEW_PUBLIC_KEY}` is provided: Edit type is PUBLIC_KEY.
    *   If neither is provided: Ask user "Do you want to change the alias or the public key for {OLD_ALIAS}?". Proceed based on response.
3.  **Process Alias Change**:
    *   Obtain/confirm `{NEW_ALIAS}`.
    *   Validate `{NEW_ALIAS}` (must not contain `-`). If invalid, trigger "Invalid New Alias Format" error.
    *   Construct new directory path: `peers/{NEW_ALIAS}-{OLD_PUBLIC_KEY}`.
    *   If this new path already exists, trigger "Target Directory Exists" error.
    *   Rename `peers/{OLD_ALIAS}-{OLD_PUBLIC_KEY}/` to `peers/{NEW_ALIAS}-{OLD_PUBLIC_KEY}/`.
    *   If rename fails, trigger "Directory Rename Failed" error.
    *   Provide success output for alias change.
4.  **Process Public Key Change**:
    *   Obtain/confirm `{NEW_PUBLIC_KEY}`.
    *   Validate `{NEW_PUBLIC_KEY}` (must be 64 lowercase hex). If invalid, trigger "Invalid New Public Key Format" error.
    *   Construct new directory path: `peers/{OLD_ALIAS}-{NEW_PUBLIC_KEY}`.
    *   If this new path already exists, trigger "Target Directory Exists" error.
    *   Rename `peers/{OLD_ALIAS}-{OLD_PUBLIC_KEY}/` to `peers/{OLD_ALIAS}-{NEW_PUBLIC_KEY}/`.
    *   If rename fails, trigger "Directory Rename Failed" error.
    *   Provide success output for public key change.

## User Interaction & Confirmation
*   If `{PEER_IDENTIFIER}` results in multiple matches, user must disambiguate.
*   If edit type (alias/key) is not specified initially, AI must ask.
*   Display current peer info before asking for new value if not provided in initial command.
    *   Example: "Current alias for peer directory `{OLD_ALIAS}-{OLD_PUBLIC_KEY}` is `{OLD_ALIAS}`. Enter new alias:"

## Success Output
*   **Alias Change**: "Successfully changed alias for peer. Old: `{OLD_ALIAS}-{OLD_PUBLIC_KEY}`, New: `{NEW_ALIAS}-{OLD_PUBLIC_KEY}`."
*   **Public Key Change**: "Successfully changed public key for peer `{OLD_ALIAS}`. Old: `{OLD_ALIAS}-{OLD_PUBLIC_KEY}`, New: `{OLD_ALIAS}-{NEW_PUBLIC_KEY}`."

## Error Handling & Responses
*   **Peer Not Found**: "Error: No peer found matching `{PEER_IDENTIFIER}`."
*   **Multiple Peers Found (Disambiguation)**: "Multiple peers match `{PEER_IDENTIFIER}`. Please specify: \n1. `{DIR_1}` \n2. `{DIR_2}`..."
*   **Invalid New Alias Format**: "Error: New alias cannot contain the `-` character."
*   **Invalid New Public Key Format**: "Error: New public key must be 64 lowercase hexadecimal characters."
*   **Target Directory Exists**: "Error: A peer directory corresponding to the new alias/key already exists (`{PROPOSED_NEW_DIR}`)."
*   **Directory Rename Failed**: "Error: Failed to rename peer directory. Please check permissions."
*   **General Error**: "Error: An unexpected issue occurred while trying to edit the peer."

## Examples
*   **User**: `edit-peer alice new_alias alicesmith`
    *   **AI (Success)**: "Successfully changed alias for peer. Old: `alice-4a6a...`, New: `alicesmith-4a6a...`."
*   **User**: `edit-peer alice-4a6a... new_key 5b7e...`
    *   **AI (Success)**: "Successfully changed public key for peer `alice`. Old: `alice-4a6a...`, New: `alice-5b7e...`."
*   **User**: `edit-peer bob`
    *   **AI (Prompt)**: "Found peer `bob-3071...`. Do you want to change the alias or the public key for `bob`?"

## AI Learning
*   Not applicable for this command.

## Dependencies
*   None.
