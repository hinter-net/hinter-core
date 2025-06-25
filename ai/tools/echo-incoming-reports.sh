#!/bin/bash

# Default values
FROM_TIMESTAMP="00000000000000"
TO_TIMESTAMP="99999999999999"
PEER_ALIAS_FILTER=""
HINTER_PEERS_DIR="hinter-core-data/peers"

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --from) FROM_TIMESTAMP="$2"; shift ;;
        --to) TO_TIMESTAMP="$2"; shift ;;
        --peer) PEER_ALIAS_FILTER="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

if [ ! -d "$HINTER_PEERS_DIR" ]; then
    echo "Peers directory not found at $HINTER_PEERS_DIR"
    exit 1
fi

for peer_dir in "$HINTER_PEERS_DIR"/*; do
    if [ -d "$peer_dir" ]; then
        dir_name=$(basename "$peer_dir")
        peer_alias=$(echo "$dir_name" | cut -d'-' -f1)
        public_key=$(echo "$dir_name" | cut -d'-' -f2)

        # Apply peer alias filter
        if [ -n "$PEER_ALIAS_FILTER" ] && [ "$peer_alias" != "$PEER_ALIAS_FILTER" ]; then
            continue
        fi

        incoming_dir="$peer_dir/incoming"
        if [ -d "$incoming_dir" ]; then
            for report in "$incoming_dir"/*.md; do
                if [ -f "$report" ]; then
                    filename=$(basename "$report")
                    # Extract first 14 characters as timestamp (YYYYMMDDHHMMSS)
                    timestamp=${filename:0:14}

                    # Validate timestamp format (14 digits)
                    if [[ ! "$timestamp" =~ ^[0-9]{14}$ ]]; then
                        continue  # Skip files with invalid timestamp format
                    fi

                    # Apply timestamp filter
                    if [[ "$timestamp" -ge "$FROM_TIMESTAMP" && "$timestamp" -le "$TO_TIMESTAMP" ]]; then
                        echo "---"
                        echo "Peer-Alias: $peer_alias"
                        echo "Peer-Public-Key: $public_key"
                        echo "Report-Filename: $filename"
                        echo "---"
                        cat "$report"
                        echo ""
                    fi
                fi
            done
        fi
    fi
done
