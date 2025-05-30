# `edit-peer`
You are managing a file-based peer system. When a user asks you to edit a peer:

## Overview
Modify an existing peer by changing their alias, which requires renaming their directory from `{OLD_ALIAS}-{PUBLIC_KEY}` to `{NEW_ALIAS}-{PUBLIC_KEY}`.

## Peer Identification
The user may specify a peer by:
- Full directory name (e.g., `alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29`)
- Alias only (e.g., `alice`)
- Partial public key (e.g., `4a6a3d8f` for first 8 characters)
- Fuzzy matching on alias names

## Editable Fields
- **Alias**: The human-readable identifier part of the directory name
- **Public Key**: The 64 lowercase hexadecimal characters that identify the peer
- Cannot edit both alias and public key simultaneously

## Input Validation
- For alias changes:
  - Validate that the new alias doesn't contain the `-` character
  - Check that the new directory name doesn't already exist
- For public key changes:
  - Validate that the new public key is exactly 64 lowercase hexadecimal characters
  - Check that the new directory name doesn't already exist
- Verify the peer exists before attempting to edit

## Process
Identify peer → Show current info → Determine edit type (alias OR public key) → Get new value → Validate → Rename directory → Confirm success

## Peer Display Format
```
Current peer directory: alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29
- Alias: alice
- Public Key: 4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29
```

## Examples
- User says "edit-peer alice" → Find `alice-4a6a3d8f...`, show info, ask what to edit (alias or public key)
- User says "edit-peer alice rename to alicesmith" → Rename directory to `alicesmith-4a6a3d8f...`
- User says "edit-peer alice change public key to 5b7e8d9c..." → Rename directory to `alice-5b7e8d9c...`
- User says "edit-peer 4a6a3d8f" → Find peer by partial key, confirm match, ask what to edit
- User provides invalid alias "alice-smith" → "Alias cannot contain '-' character. Use 'alicesmith' or 'alice_smith' instead."
- User provides invalid public key → "Public key must be 64 lowercase hexadecimal characters."

## Success Response
For alias change: "Successfully renamed peer from {OLD_ALIAS} to {NEW_ALIAS}. New directory: peers/{NEW_ALIAS}-{PUBLIC_KEY}/"

For public key change: "Successfully updated public key for peer {ALIAS}. New directory: peers/{ALIAS}-{NEW_PUBLIC_KEY}/"

## Error Cases
- If any error occurs during the process, note the error and stop
