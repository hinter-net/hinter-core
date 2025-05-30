# `ingest-reports`
You are managing a file-based peer system. When a user asks you to ingest reports:

## Overview
Process incoming reports from peers by analyzing their content and creating new entries in the user's personal network representation based on the information received.

## Report Location
- Incoming reports are stored in `peers/{ALIAS}-{PUBLIC_KEY}/incoming/` directories
- Reports are Markdown files with timestamp filenames: `YYYYMMDDHHMMSS.md`
- Each report may contain multiple pieces of information to be processed

## Processing Rules
- Execute the `ai/tools/read-entries.sh` script to get all entries for context
- Ingest the COMPLETE output into your context (do NOT use grep or other command-line tools to filter)
- Scan all `peers/*/incoming/` directories for unprocessed reports
- Verify each peer directory exists and is properly structured
- For each report, analyze content using AI to extract relevant information
- Cross-reference with existing entries to understand peer context and relationships
- **Apply learned feedback patterns**: Use insights from user's previous edits and annotations
- Create new entries in `entries/` directory based on extracted information
- Mark processed reports with metadata to avoid reprocessing
- Apply learned user preferences for information filtering
- Respect privacy rules and sharing preferences
- **Learn from user modifications**: Track how users edit AI-generated entries to improve future processing

## Entry Creation from Reports
- Create timestamp-based entries: `YYYYMMDDHHMMSS_from_[alias].md`
- Include metadata identifying the source peer directory and original report
- Extract and organize key information (people, opportunities, events, insights)
- Apply user feedback patterns to filter relevant vs. irrelevant information
- Maintain references to original reports for traceability

## Process
Execute read-entries.sh → Scan peer directories → Identify unprocessed reports → Analyze content → Create new entries → Mark as processed → Confirm success

## User Feedback Integration and Learning
- Check for existing user feedback patterns about information types
- Apply peer-specific preferences (e.g., "information from alice about tech trends is valuable")
- Filter out information types marked as irrelevant by user
- Learn from user annotations on previously created entries
- **Process feedback from user edits**: When users modify or annotate ingested entries, learn these preferences
- **Adapt filtering rules**: Automatically adjust what information gets prioritized based on user behavior
- **Cross-reference with outgoing preferences**: Use patterns from review-report-candidates to inform incoming processing

## Report Processing Status
- Track which reports have been processed to avoid duplication
- Maintain processing log for debugging and user review
- Handle partial processing failures gracefully
- Allow reprocessing if user preferences change

## Entry Metadata Format
```markdown
<!-- SOURCE: Report from [Alias] -->
<!-- ORIGINAL: peers/[alias-public_key]/incoming/[timestamp].md -->
<!-- PROCESSED: [current_timestamp] -->
<!-- RELEVANCE: [high/medium/low based on learned preferences] -->

[Extracted and organized information content]
```

## Success Response
On success: "Processed [number] reports from [list of peers]. Created [number] new entries."

## Error Cases
- If peers/ directory doesn't exist, note this and stop
- If incoming directories are empty, inform user no new reports to process
- If peer directory structure is invalid, log error and continue with valid peers
- If report files are corrupted or unreadable, log error and continue with others
- If entry creation fails, note this and continue processing other reports
- If AI processing fails, create basic entry with raw report content

## Examples
- User says "ingest-reports" → Process all unprocessed incoming reports
- User says "ingest-reports from alice" → Process only reports from specific peer alias
- User says "ingest-reports recent" → Process reports from last 7 days only
- User says "reprocess-reports" → Reprocess all reports ignoring previous processing status
