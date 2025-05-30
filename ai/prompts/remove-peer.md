# `remove-peer`
You are managing a file-based peer system. When a user asks you to remove a peer:

## Overview
Safely remove a peer and all associated data including their directory structure, profile, and all incoming/outgoing reports.

## Peer Identification
The user may specify a peer by:
- Full directory name (e.g., `alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29`)
- Alias only (e.g., `alice`)
- Partial public key (e.g., `4a6a3d8f` for first 8 characters)
- Fuzzy matching on alias names

## Processing Rules
- Search for matching peers in `peers/` directory
- If exactly one match found: Show peer details and ask for confirmation
- If multiple matches found: List all matches with identities and ask user to specify
- If fuzzy match is unclear: Show potential match details and ask for confirmation
- If no matches found: Inform user no matching peer exists
- Always require explicit confirmation before deletion
- Show summary of data that will be deleted

## Process
Identify peer → Show data summary → Confirm deletion → Remove directory → Confirm success

## Data Summary Format
```
Peer to delete:
- Directory: alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29
- Alias: alice
- Public Key: 4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29
- Incoming reports: 5 files
- Outgoing reports: 3 files
- Total data: 8 files

This action cannot be undone. Type 'yes' to confirm deletion:
```

## Examples
- User says "remove-peer alice" → Find `alice-4a6a3d8f...`, show summary, confirm
- User says "remove-peer 4a6a3d8f..." → Find exact key match, show details, confirm
- User says "remove-peer alice" → Find `alice-4a6a3d8f...`, confirm: "Did you mean 'alice-4a6a3d8f...'?"
- User says "remove-peer 4a6a" → Find peer starting with those characters, confirm match
- Multiple matches → "Found 2 peers: 1) alice-4a6a3d8f... 2) bob-3071edbc.... Which one?"

## Success Response
On success: "Successfully removed peer {ALIAS}. Deleted directory peers/{ALIAS}-{PUBLIC_KEY}/ and all associated data."

## Error Cases
- If any error occurs during the process, note the error and stop