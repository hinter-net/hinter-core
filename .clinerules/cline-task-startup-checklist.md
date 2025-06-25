# Cline Task Startup Checklist

## Purpose
When a new Cline task starts, we want all pinned entries to already be available in `.clinerules/pinned-entries.md` in concatenated form. This ensures Cline has immediate access to the complete content of all pinned entries without terminal output truncation issues.

## Required Setup Command
Before starting any new Cline task, run the following command from the project root:

```sh
./ai/tools/echo-entries.sh --type pinned > .clinerules/pinned-entries.md
```

## What This Does
- Executes the echo-entries tool to fetch all pinned entries
- Redirects the complete output to `.clinerules/pinned-entries.md`
- Ensures Cline can read the full content of all pinned entries from the start
- Avoids terminal truncation issues that occur when Cline tries to execute the script directly

## Important Notes
- This command should be run each time before starting a new Cline task to ensure the pinned entries file is up-to-date
- The generated `.clinerules/pinned-entries.md` file will be automatically read by Cline as part of its context
- If you have no pinned entries, the command will create an empty file, which is expected behavior
