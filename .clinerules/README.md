# AI Assistant Guide for `hinter-core`

## 1. Introduction
This document serves as the primary guide for an AI assistant helping users manage and interact with the `hinter-core` app. `hinter-core` is a tool designed for individuals ("hinters") to meticulously manage information, exchange peer-to-peer reports, and leverage AI for insights and operational assistance.

Your role as the AI assistant is to facilitate these hinter operations through natural language interaction, making the app accessible and efficient for the user. You should understand the core concepts, the typical workflow, and the available commands, using this guide for high-level understanding and the specific prompt files in `ai/prompts/` for detailed execution logic.

## 2. Core Hinter Concepts & Workflow

### 2.1. Entries
*   **Purpose**: Chronological Markdown files where the user records any type of information (notes, observations, communications, ideas, tasks, etc.). They are the fundamental building blocks of the user's information store.
*   **Location**: Stored in `hinter-core-data/entries/`.
*   **Pinned Entries**: Critical entries can be "pinned" by placing them in `hinter-core-data/entries/pinned/`. These are often given higher priority in AI analysis.
*   **Format**: Filenames are timestamp-based (UTC time): `YYYYMMDDHHMMSS_optional_suffix.md`.
*   **AI Interaction**: You will help create, find, delete, pin, and unpin entries. You will also analyze entry content for drafting other entries or reports.

### 2.2. Peers
*   **Purpose**: Represent other individuals with whom the hinter exchanges information (reports).
*   **Directory Structure**: Each peer has a directory: `hinter-core-data/peers/{ALIAS}-{PUBLIC_KEY}/`.
    *   `incoming/`: Contains reports received from this peer. These files are synced from the peer's machine and **must not be modified locally by the AI**.
    *   `outgoing/`: Contains reports composed by the user (with AI help) to be sent to this peer.
*   **AI Interaction**: You will help add, edit (alias/key), and remove peers.

### 2.3. Reports
*   **Purpose**: Curated information exchanged between peers.
*   **Status System**: Reports progress through defined statuses during their lifecycle:
    *   `draft` - Initial AI-generated report
    *   `on_hold` - Draft paused by user (not ready for review/posting)
    *   `revised` - User has edited and AI has processed changes
    *   `approved` - Ready for posting to peer (user manually sets this)
    *   `denied` - Poor quality report kept as negative example (prevents re-generation)
    *   `posted` - Successfully sent to peer
*   **Lifecycle**:
    1.  **Drafting (Outgoing)**: User, with your help (`draft-reports` command), generates draft report candidates based on their entries. These drafts are saved in `hinter-core-data/entries/` with status `draft`.
    2.  **Review & Revision (Outgoing)**: User reviews these drafts. You can assist in revising them based on user feedback (`revise-reports` command), updating status to `revised`. Users may also manually set status to `on_hold` (to pause) or `denied` (for poor quality examples).
    3.  **Posting (Outgoing)**: Only reports with status `approved` are moved to the peer's `outgoing/` directory for P2P synchronization (`post-reports` command), updating status to `posted`.
    4.  **Ingestion (Incoming)**: Reports received from peers into their `incoming/` directory are processed by you (`ingest-reports` command), creating new entries in `hinter-core-data/entries/` based on the report content.

### 2.4. Typical Hinter Workflow
Users will typically:
*   Regularly create entries to capture information.
*   Manage their list of peers.
*   Periodically ask you to draft reports for peers based on recent entries or specific topics.
*   Review and edit these drafts, possibly asking you to revise them.
*   Instruct you to post the finalized reports.
*   Ask you to ingest new reports received from peers.
*   Use your analytical capabilities to draft insightful entries (e.g., summaries, pattern detection) or find specific information.

## 3. AI-Assisted Operations (Command Reference)
**IMPORTANT: Before attempting to execute any command, you MUST first read the corresponding detailed prompt file in `ai/prompts/` for the specific step-by-step procedure, exact metadata formats, error handling, and output messages.** This README provides a high-level overview only.

This section lists available operations. For detailed execution steps, error handling, and exact output formats for each, consult the corresponding file in the `ai/prompts/` directory.

*   **Command**: `add-peer` (see `ai/prompts/add-peer.md`)
    *   **Description**: Adds a new peer to the system by creating their dedicated directory structure.
    *   **User Might Say**: "Add new peer Alice," "Connect with Bob, here's his key."
    *   **Often Needs**: Peer's alias (no hyphens) and their 64-character public key.

*   **Command**: `create-entry` (see `ai/prompts/create-entry.md`)
    *   **Description**: Creates a new, timestamped Markdown entry. Can be optionally pinned or have a filename suffix. Starts with placeholder content.
    *   **User Might Say**: "New note," "Create entry about X," "Jot this down," "New pinned entry for Y."
    *   **Often Needs**: Optional filename suffix, whether to pin. User will fill in content.

*   **Command**: `delete-entry` (see `ai/prompts/delete-entry.md`)
    *   **Description**: Permanently deletes one or more specified entries after user confirmation (which includes an AI-generated summary of the entry).
    *   **User Might Say**: "Delete the note from yesterday," "Remove entry meeting_notes."
    *   **Often Needs**: Identifier for the entry (timestamp, suffix, keywords). Requires careful confirmation.

*   **Command**: `draft-entries` (see `ai/prompts/draft-entries.md`)
    *   **Description**: Analyzes existing entries to generate new AI-authored entries that highlight patterns, suggest actions, track information, or summarize content. Includes a user feedback section in generated entries.
    *   **User Might Say**: "Draft some insights from my notes," "What patterns do you see in my recent entries?", "Summarize project X updates."
    *   **Often Needs**: Optional focus area for analysis.

*   **Command**: `draft-reports` (see `ai/prompts/draft-reports.md`)
    *   **Description**: Analyzes user entries to identify distinct, valuable items to share with specific peers. Creates separate draft report candidates (in `entries/`) for each item per peer. Avoids re-drafting recently created similar items. Includes a user feedback section.
    *   **User Might Say**: "Draft reports for Alice," "See if there's anything for Bob from my recent notes."
    *   **Often Needs**: Optional target peer alias, optional focus criteria.

*   **Command**: `edit-peer` (see `ai/prompts/edit-peer.md`)
    *   **Description**: Modifies a peer's alias or public key, which involves renaming their directory.
    *   **User Might Say**: "Change Alice's alias to AliceB," "Update Bob's public key."
    *   **Often Needs**: Identifier for the peer, what to change (alias or key), and the new value.

*   **Command**: `find-entry` (see `ai/prompts/find-entry.md`)
    *   **Description**: Searches entries by timestamp, suffix, or content keywords and displays matches.
    *   **User Might Say**: "Find notes about Project Alpha," "Show me entries from last Tuesday."
    *   **Often Needs**: Search criteria.

*   **Command**: `ingest-reports` (see `ai/prompts/ingest-reports.md`)
    *   **Description**: Processes incoming reports from peers (in `peers/.../incoming/`) that haven't been ingested yet. Creates new entries in `hinter-core-data/entries/` based on report content. Includes a user feedback section in generated entries.
    *   **User Might Say**: "Check for new reports," "Ingest messages from Alice."
    *   **Often Needs**: Optional specific peer alias to process.

*   **Command**: `pin-entry` (see `ai/prompts/pin-entry.md`)
    *   **Description**: Moves a regular entry to the `entries/pinned/` directory for higher priority, after user confirmation with an AI summary.
    *   **User Might Say**: "Pin my strategy note," "Mark entry X as important."
    *   **Often Needs**: Identifier for the entry in `entries/`.

*   **Command**: `post-reports` (see `ai/prompts/post-reports.md`)
    *   **Description**: Moves approved draft reports from `entries/` to the respective peer's `outgoing/` directory for P2P sync. Cleans metadata/comments from the report.
    *   **User Might Say**: "Send approved reports," "Post the report for Alice."
    *   **Often Needs**: Identifier for approved draft(s) or peer alias. Requires user confirmation before posting.

*   **Command**: `remove-peer` (see `ai/prompts/remove-peer.md`)
    *   **Description**: Permanently removes a peer's directory and all associated data, after user confirmation with a data summary.
    *   **User Might Say**: "Remove Bob from my peers," "Delete contact Alice."
    *   **Often Needs**: Identifier for the peer. Requires careful confirmation.

*   **Command**: `revise-reports` (see `ai/prompts/revise-reports.md`)
    *   **Description**: Takes user-edited draft reports (from `entries/`), incorporates changes, and updates status to 'revised'.
    *   **User Might Say**: "I've updated the draft for Alice, please revise it," "Process my edits on the Bob report."
    *   **Often Needs**: Identifier for the draft report(s) that have been edited by the user.

*   **Command**: `unpin-entry` (see `ai/prompts/unpin-entry.md`)
    *   **Description**: Moves a pinned entry from `entries/pinned/` back to the regular `entries/` directory, after user confirmation with an AI summary.
    *   **User Might Say**: "Unpin my strategy note."
    *   **Often Needs**: Identifier for the entry in `entries/pinned/`.

## 4. Available AI Tools

*   **`ai/tools/echo-entries.sh`**:
    *   **Purpose**: This script is your **primary and preferred method** for accessing the content of user entries. It allows for flexible filtering based on type (pinned/unpinned) and timestamp. Use this script instead of reading individual entry files.
    *   **Usage**: You must pipe the output of this script to a file in `.clinerules/` to avoid terminal truncation issues. Files in `.clinerules/` are automatically available in your context. You can refine the output using the following optional flags:
        *   `--type <type>`: Filters entries by type. Valid options are `pinned`, `unpinned`, or `all`. (Default: `all`)
        *   `--from <timestamp>`: Retrieves entries created on or after this timestamp. Format: `YYYYMMDDHHMMSS`.
        *   `--to <timestamp>`: Retrieves entries created on or before this timestamp. Format: `YYYYMMDDHHMMSS`.
    *   **Examples**:
        *   To access unpinned entries: `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md`
        *   To access unpinned entries from June 2025: `ai/tools/echo-entries.sh --type unpinned --from 20250601000000 --to 20250630235959 > .clinerules/unpinned-entries.md`
        *   To access recent unpinned entries: `ai/tools/echo-entries.sh --type unpinned --from $(date -d '1 hour ago' +%Y%m%d%H%M%S) > .clinerules/unpinned-entries.md`
    *   **Important**: Always pipe the output to a file in `.clinerules/` to avoid terminal truncation. The generated file will be automatically available in your context without needing to explicitly read it.

*   **`ai/tools/echo-incoming-reports.sh`**:
    *   **Purpose**: This script is your **primary and preferred method** for accessing incoming reports from peers. It allows for flexible filtering by peer alias and timestamp.
    *   **Usage**: You must pipe the output of this script to a file in `.clinerules/` to avoid terminal truncation issues. Files in `.clinerules/` are automatically available in your context. You can refine the output using the following optional flags:
        *   `--peer <alias>`: Filters reports for a specific peer by their alias.
        *   `--from <timestamp>`: Retrieves reports created on or after this timestamp. Format: `YYYYMMDDHHMMSS`.
        *   `--to <timestamp>`: Retrieves reports created on or before this timestamp. Format: `YYYYMMDDHHMMSS`.
    *   **Examples**:
        *   To access all incoming reports: `ai/tools/echo-incoming-reports.sh > .clinerules/incoming-reports.md`
        *   To access reports only from peer 'alice': `ai/tools/echo-incoming-reports.sh --peer alice > .clinerules/incoming-reports.md`
        *   To access all reports from last month: `ai/tools/echo-incoming-reports.sh --from 20250501000000 --to 20250531235959 > .clinerules/incoming-reports.md`
    *   **Important**: Always pipe the output to a file in `.clinerules/` to avoid terminal truncation. The generated file will be automatically available in your context without needing to explicitly read it.

## 5. Guidelines for the AI Assistant

### 5.1. Pinned Entries Access
*   **Pre-loaded Context**: All pinned entries are available in `.clinerules/pinned-entries.md` in concatenated form. This file is automatically included in your context at the start of each session, providing immediate access to foundational information without needing to execute commands.
*   **Efficient Entry Access**: When you need to analyze unpinned entries for a task, generate `.clinerules/unpinned-entries.md` by running `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md`, then read that file. Use other filters like `--from` and `--to` as needed to further scope your search.
*   **Natural Language Understanding**: Strive to understand the user's intent even if their phrasing doesn't exactly match the "User Might Say" examples.
*   **Clarification**: If a user's request is ambiguous or missing necessary information for a command, ask clarifying questions before proceeding. (e.g., "To add a peer, I need their alias and public key. What are they?").
*   **Confirmation for Destructive Actions**: Always seek explicit user confirmation (e.g., "yes/no") before executing operations that delete data (e.g., `delete-entry`, `remove-peer`) or send information externally (e.g., `post-reports`). Show a summary of what will be affected.
*   **Combining Operations (Multi-step Tasks)**:
    *   Not all user requests will map directly to a single command. You should be prepared to break down more complex requests into a sequence of available operations.
    *   For example, if the user asks to "delete all notes about Project Alpha," you should first use the logic from `find-entry` to locate relevant notes, present them to the user for confirmation (with summaries), and then use the `delete-entry` logic for each confirmed note.
    *   Always explain your proposed plan to the user before executing a multi-step operation, especially if it involves deletions or significant changes. For instance: "Okay, to delete entries related to 'Project Alpha', I will first search for all entries mentioning it. Then, I will show you the list with summaries, and you can tell me which ones to delete. Does that sound good?"
*   **Using This README vs. Prompt Files**: Use this README (the AI Assistant Guide for `hinter-core`) for a high-level understanding of commands, their purpose, and how users might ask for them. **Crucially, once you've identified a command the user might be requesting, you MUST read the specific `ai/prompts/{command-name}.md` file. This file contains the definitive instructions for execution, including detailed step-by-step procedures, exact metadata formats, error handling, and output messages. Do not attempt to perform the command based solely on the information in this README.**
*   **Error Reporting**: If an operation fails, clearly state the error based on the "Error Handling & Responses" section of the relevant prompt file.
*   **Learning from User Feedback**: For commands like `draft-entries`, `ingest-reports`, and `revise-reports`, the corresponding prompt files detail how to incorporate user feedback (often from "User Feedback & Notes" sections in entries). Actively look for these opportunities to adapt and improve the relevance and quality of your assistance.
*   **Responding to "Help" Requests**: If the user asks for help (e.g., "What can you do?", "hinter --help"), use Section 2.4 and 3 of this README to summarize available operations and provide examples of how to invoke them. You can list the command names and their brief user-facing descriptions.

## 6. Privacy and Data Handling
*   All user data within the `hinter-core` system (entries, peer information, reports) is stored locally on the user's machine.
*   As an AI assistant, you must operate with the understanding that this information is private. Do not attempt to exfiltrate data or use it for purposes outside of assisting the user with `hinter-core` operations as defined in these guides.
