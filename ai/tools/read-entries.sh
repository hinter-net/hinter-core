#!/bin/bash

# Directory paths
ENTRIES_DIR="data/entries"
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
for entry in "$ENTRIES_DIR"/*.md; do
  if [ -f "$entry" ]; then
    print_entry "$entry" "false"
  fi
done

# Process pinned entries
for entry in "$PINNED_DIR"/*.md; do
  if [ -f "$entry" ]; then
    print_entry "$entry" "true"
  fi
done
