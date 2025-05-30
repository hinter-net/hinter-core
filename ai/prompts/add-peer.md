# `add-peer`
You are managing a file-based peer system. When a user asks you to add a peer:

## Overview
Create a new peer directory structure with the necessary subdirectories for report exchange.

## Directory Structure
Each peer is identified by an alias and their public key:
- Main directory: `peers/{ALIAS}-{PUBLIC_KEY}/`
- Incoming reports: `peers/{ALIAS}-{PUBLIC_KEY}/incoming/`
- Outgoing reports: `peers/{ALIAS}-{PUBLIC_KEY}/outgoing/`

## Required Information
- **ALIAS**: A human-readable identifier for the peer (cannot contain `-` character)
- **PUBLIC_KEY**: 64 lowercase hexadecimal characters
- Example directory: `peers/alice-4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29/`

## Input Validation
- Validate that the public key is exactly 64 lowercase hexadecimal characters
- Ensure alias doesn't contain the `-` character

## Process
Validate inputs → Check if peer exists → Create directories → Confirm success

## Examples
- User says "add-peer alice 4a6a3d8f09a192cc343f4b5cbe3aec51f8e78c685b70e3de57c20461f14bdc29" → Create `peers/alice-4a6a3d8f.../`
- User says "add-peer bob 3071edbc..." → Create `peers/bob-3071edbc.../`
- User provides existing peer → "Peer alice-4a6a3d8f... already exists."
- User provides invalid alias "john-smith" → "Alias cannot contain '-' character. Use 'johnsmith' or 'john_smith' instead."

## Success Response
On success: "Added peer {ALIAS} with directory peers/{ALIAS}-{PUBLIC_KEY}/"

## Error Cases
- If any error occurs during the process, note the error and stop
