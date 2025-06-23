#!/bin/bash

# Default values
TYPE="all"
FROM_TIMESTAMP="00000000000000"
TO_TIMESTAMP="99999999999999"
HINTER_DATA_DIR="hinter-core-data"

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --type) TYPE="$2"; shift ;;
        --from) FROM_TIMESTAMP="$2"; shift ;;
        --to) TO_TIMESTAMP="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# --- Helper Function to Process Files ---
process_files() {
    local dir=$1
    local entry_type=$2 # "pinned" or "unpinned"
    for entry in "$dir"/*.md; do
        if [[ -f "$entry" ]]; then
            filename=$(basename "$entry")
            # Extract first 14 characters as timestamp (YYYYMMDDHHMMSS)
            timestamp=${filename:0:14}

            # Validate timestamp format (14 digits)
            if [[ ! "$timestamp" =~ ^[0-9]{14}$ ]]; then
                continue  # Skip files with invalid timestamp format
            fi

            if [[ "$timestamp" -ge "$FROM_TIMESTAMP" && "$timestamp" -le "$TO_TIMESTAMP" ]]; then
                echo "---"
                echo "Entry-Type: $entry_type"
                echo "Entry-File: $filename"
                echo "Entry-Path: $entry"
                echo "---"
                cat "$entry"
                echo ""
            fi
        fi
    done
}

# --- Main Logic ---
# Determine which directories to search based on the --type flag
if [[ "$TYPE" == "pinned" ]]; then
    process_files "$HINTER_DATA_DIR/entries/pinned" "pinned"
elif [[ "$TYPE" == "unpinned" ]]; then
    process_files "$HINTER_DATA_DIR/entries" "unpinned"
elif [[ "$TYPE" == "all" ]]; then
    process_files "$HINTER_DATA_DIR/entries" "unpinned"
    process_files "$HINTER_DATA_DIR/entries/pinned" "pinned"
else
    echo "Invalid value for --type: $TYPE. Use 'pinned', 'unpinned', or 'all'."
    exit 1
fi
