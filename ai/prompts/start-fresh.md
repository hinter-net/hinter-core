# `start-fresh`

## Description
Removes all current data (entries and peers) to provide a clean slate for starting with the hinter-core system. This is commonly used by new users to clear example/placeholder data and begin with their own content. The operation preserves the directory structure but deletes all content within `data/entries/`, `data/entries/pinned/`, and `data/peers/`.

## Invocation / Arguments
*   **Invocation**: User must say exactly: `start-fresh`
    *   Only this exact phrase should trigger this command.
    *   Do not accept variations like "clean slate", "delete everything", "remove example data", etc.
*   **Parameters**: None required.

## Core Logic / Procedure
1.  **Scan Current Data**:
    *   Count all files in `data/entries/` (regular entries).
    *   Count all files in `data/entries/pinned/` (pinned entries).
    *   Count all peer directories in `data/peers/` and their contents.
    *   Generate a summary of what will be deleted.
2.  **Present Data Summary**:
    *   Display a summary of all data that will be removed:
        ```
        Ready to start fresh with your hinter-core system!
        
        Current data to be removed:
        - Regular entries: {N_REGULAR} file(s) in data/entries/
        - Pinned entries: {N_PINNED} file(s) in data/entries/pinned/
        - Peers: {N_PEERS} peer(s) with all their reports
          {LIST_OF_PEER_ALIASES}
        
        This will give you a clean slate to begin with your own data.
        Directory structure will be preserved and ready for use.
        
        Note: If this includes your own important data (not just examples), 
        consider backing it up first.
        
        Proceed with starting fresh? (yes/no)
        ```
3.  **User Confirmation**:
    *   Require explicit user confirmation by typing 'yes'.
    *   If user provides any response other than 'yes', abort the operation.
4.  **Execute Deletion**:
    *   Delete all files in `data/entries/` (preserve the directory itself).
    *   Delete all files in `data/entries/pinned/` (preserve the directory itself).
    *   Delete all peer directories and their contents in `data/peers/` (preserve the peers/ directory itself).
    *   If any deletion fails, trigger appropriate error and stop the process.
5.  **Verify Clean State**:
    *   Confirm that all target directories are empty but still exist.
    *   Provide success confirmation with summary of what was removed.

## User Interaction & Confirmation
*   **Confirmation Required**: Requires user confirmation (typing 'yes') after presenting a summary of what will be removed.
*   **Gentle Warning**: Mentions backup consideration for important data without being overly alarming.

## Success Output
*   "Successfully started fresh! Your hinter-core system is now ready for your data.
    
    Removed:
    - {N_REGULAR} regular entries
    - {N_PINNED} pinned entries  
    - {N_PEERS} peers and all their reports
    
    You can now begin creating your own entries and adding your peers."

## Error Handling & Responses
*   **No Data Found**: "Your hinter-core system is already in a fresh state - no data to remove. You're ready to start creating entries and adding peers!"
*   **Partial Deletion Failed**: "Error: Could not delete some files. Stopped operation to prevent partial cleanup. Please check permissions and try again."
*   **Directory Access Failed**: "Error: Could not access data directories. Please check that the hinter-core directory structure exists."
*   **General Error**: "Error: An unexpected issue occurred while trying to start fresh. Your data may be partially affected."

## Examples
*   **User**: `start-fresh`
    *   **AI (Confirmation)**: (Shows data summary and asks "Proceed with starting fresh? (yes/no)")
    *   **User**: `yes`
    *   **AI (Success)**: "Successfully started fresh! Your hinter-core system is now ready for your data. Removed: - 4 regular entries - 2 pinned entries - 2 peers and all their reports..."
*   **User**: `start-fresh` (when no data exists)
    *   **AI (No Data)**: "Your hinter-core system is already in a fresh state - no data to remove. You're ready to start creating entries and adding peers!"

## AI Learning
*   Not applicable for this command.

## Dependencies
*   None.
