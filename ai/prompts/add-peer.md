# `add-peer`

## Description
Creates a new peer directory (`peers/{ALIAS}-{PUBLIC_KEY}/`) for report exchange. The hinter-core app will automatically create the necessary `incoming/` and `outgoing/` subdirectories when needed.

## Invocation / Arguments
*   **Invocation**: User typically says: `add-peer {ALIAS} {PUBLIC_KEY}`
*   **Parameters**:
    *   `{ALIAS}` (required):
        *   A human-readable identifier for the peer.
        *   **Validation**: Must NOT contain the `-` (hyphen) character.
    *   `{PUBLIC_KEY}` (required):
        *   The peer's 64-character public key.
        *   **Validation**: Must be exactly 64 lowercase hexadecimal characters.

## Core Logic / Procedure
1.  **Receive Inputs**: Obtain `{ALIAS}` and `{PUBLIC_KEY}` from the user.
2.  **Validate Alias**:
    *   If `{ALIAS}` contains a `-`, trigger "Invalid Alias Format" error.
3.  **Validate Public Key**:
    *   If `{PUBLIC_KEY}` is not 64 lowercase hexadecimal characters, trigger "Invalid Public Key Format" error.
4.  **Construct Directory Path**: Form the full peer directory path: `hinter-core-data/peers/{ALIAS}-{PUBLIC_KEY}`.
5.  **Check for Existing Peer**:
    *   If the directory path from step 4 already exists, trigger "Peer Already Exists" error.
6.  **Create Directory**:
    *   Create the main peer directory: `hinter-core-data/peers/{ALIAS}-{PUBLIC_KEY}/`
    *   If directory creation fails, trigger "Directory Creation Failed" error.
7.  **Confirm Success**: If all steps complete without error, provide the success output.

## User Interaction & Confirmation
*   This command typically does not require intermediate confirmation if inputs are valid and the peer does not already exist. Confirmation is primarily through the success or error messages.

## Success Output
*   "Added peer `{ALIAS}`. Directory: `hinter-core-data/peers/{ALIAS}-{PUBLIC_KEY}/`"

## Error Handling & Responses
*   **Peer Already Exists**: "Error: Peer `{ALIAS}-{PUBLIC_KEY}` already exists."
*   **Invalid Alias Format**: "Error: Alias cannot contain the `-` character. Please use an alias like 'johnsmith' or 'john_smith'."
*   **Invalid Public Key Format**: "Error: Public key must be 64 lowercase hexadecimal characters."
*   **Directory Creation Failed**: "Error: Could not create directory for peer `{ALIAS}-{PUBLIC_KEY}`. Please check permissions or disk space."
*   **General Error**: "Error: An unexpected issue occurred while trying to add peer `{ALIAS}-{PUBLIC_KEY}`."

## Examples
*   **User**: `add-peer alice 4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29`
    *   **AI (Success)**: "Added peer `alice`. Directory: `hinter-core-data/peers/alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29/`"
*   **User**: `add-peer bob-by 3071edbc...`
    *   **AI (Error)**: "Error: Alias cannot contain the `-` character. Please use an alias like 'bobby' or 'bob_by'."
*   **User**: `add-peer charlie 123`
    *   **AI (Error)**: "Error: Public key must be 64 lowercase hexadecimal characters."
*   **User**: `add-peer alice 4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29` (if `hinter-core-data/peers/alice-4a6a.../` already exists)
    *   **AI (Error)**: "Error: Peer `alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29` already exists."

## AI Learning
*   Not applicable for this command.

## Dependencies
*   None.
