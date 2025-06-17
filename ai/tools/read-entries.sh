#!/bin/bash

# Directory paths
ENTRIES_DIR="hinter-core-data/entries"
PINNED_DIR="$ENTRIES_DIR/pinned"

# Function to print entry details
print_entry() {
  local file=$1
  local is_pinned=$2
  local filename=$(basename "$file")
  
  echo "Filename: $filename"
  echo "Pinned: $is_pinned"
  echo "Content:"
  cat "$file"
  echo ""
}

# Process regular entries
# Ensure chronological order by sorting filenames (YYYYMMDDHHMMSS*.md)
# 2>/dev/null suppresses errors from ls if no files match (e.g., empty directory)
for entry in $(ls -1 "$ENTRIES_DIR"/*.md 2>/dev/null | sort); do
  if [ -f "$entry" ]; then
    print_entry "$entry" "false"
  fi
done

# Process pinned entries
# Ensure chronological order by sorting filenames
for entry in $(ls -1 "$PINNED_DIR"/*.md 2>/dev/null | sort); do
  if [ -f "$entry" ]; then
    print_entry "$entry" "true"
  fi
done
