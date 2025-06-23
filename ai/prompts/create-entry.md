# `create-entry`

## Description
Creates a new Markdown entry file with a timestamp-based name in the appropriate directory (`entries/` or `entries/pinned/`). The new entry will contain placeholder text.

## Invocation / Arguments
*   **Invocation**: User typically says: `create-entry [optional_suffix] [optional_pin_flag]`
    *   Example: `create-entry meeting_notes`
    *   Example: `create-entry important_idea --pin`
*   **Parameters**:
    *   `{OPTIONAL_SUFFIX}` (optional):
        *   A string to append to the timestamp in the filename (e.g., `_meeting_notes`).
        *   If not provided, no suffix is used.
    *   `{OPTIONAL_PIN_FLAG}` (optional):
        *   A flag (e.g., `--pin`, `pinned`) indicating the entry should be placed in the `entries/pinned/` directory.
        *   If not provided, the entry is placed in `entries/`.

## Core Logic / Procedure
1.  **Determine Timestamp**: Get the current UTC timestamp in `YYYYMMDDHHMMSS` format.
2.  **Determine Filename**:
    *   If `{OPTIONAL_SUFFIX}` is provided, construct filename as: `{TIMESTAMP}{OPTIONAL_SUFFIX}.md`.
    *   If `{OPTIONAL_SUFFIX}` is not provided, construct filename as: `{TIMESTAMP}.md`.
3.  **Determine Directory**:
    *   If `{OPTIONAL_PIN_FLAG}` is present, set target directory to `hinter-core-data/entries/pinned/`.
    *   Otherwise, set target directory to `hinter-core-data/entries/`.
4.  **Construct Full Path**: Combine the target directory and the filename.
5.  **Check for File Collision**:
    *   Although timestamp-based names are usually unique, if the exact full path already exists, append a small, unique counter (e.g., `_1`, `_2`) to `{OPTIONAL_SUFFIX}` (or create a suffix like `_1` if none existed) and reconstruct the filename and full path. Repeat if necessary.
6.  **Create File Content**: The content of the new file should be exactly: `Write your entry here`
7.  **Write File**: Create the new Markdown file at the constructed full path with the specified content.
    *   If file creation fails, trigger "File Creation Failed" error.
8.  **Confirm Success**: If the file is created successfully, provide the success output.

## User Interaction & Confirmation
*   This command typically does not require intermediate confirmation.

## Success Output
*   If not pinned: "Created new entry: `{TARGET_DIRECTORY}{FILENAME}`"
*   If pinned: "Created new pinned entry: `{TARGET_DIRECTORY}{FILENAME}`"
    *   (Where `{TARGET_DIRECTORY}` is `hinter-core-data/entries/` or `hinter-core-data/entries/pinned/` and `{FILENAME}` is the generated filename)

## Error Handling & Responses
*   **File Creation Failed**: "Error: Could not create entry file at `{FULL_PATH}`. Please check permissions or disk space."
*   **General Error**: "Error: An unexpected issue occurred while trying to create the entry."

## Examples
*   **User**: `create-entry meeting_notes`
    *   **AI (Success)**: "Created new entry: `hinter-core-data/entries/20250530161500_meeting_notes.md`" (assuming current timestamp)
*   **User**: `create-entry`
    *   **AI (Success)**: "Created new entry: `hinter-core-data/entries/20250530161501.md`"
*   **User**: `create-entry important_contact --pin`
    *   **AI (Success)**: "Created new pinned entry: `hinter-core-data/entries/pinned/20250530161502_important_contact.md`"

## AI Learning
*   Not applicable for this command.

## Dependencies
*   None.
