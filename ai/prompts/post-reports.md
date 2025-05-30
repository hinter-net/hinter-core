# `post-reports`
You are managing a file-based peer system. When a user asks you to post reports:

## Overview
Move finalized and approved draft report candidates from the entries directory to the appropriate peer outgoing directories for distribution.

## Report Selection
- Process draft reports with `STATUS: approved` in their metadata
- Allow user to specify which reports to post (all approved, specific peer, recent, etc.)
- Verify reports have been reviewed and approved before posting
- Skip reports marked as `rejected`, `postponed`, or still in `draft` status

## Report Identification
The user may specify reports by:
- All approved reports (e.g., "post-reports")
- Specific peer alias (e.g., "post-reports for alice")
- Recent approved reports (e.g., "post-reports recent")
- Specific report by filename or timestamp

## Processing Rules
- Search for approved draft reports in `entries/` directory
- Extract target peer information from report metadata
- Verify the target peer exists in the `peers/` directory
- Create clean final report without draft metadata and user feedback comments
- Copy final report to appropriate `peers/{ALIAS}-{PUBLIC_KEY}/outgoing/` directory
- Use timestamp-based filename: `YYYYMMDDHHMMSS.md`
- Update original draft report status to `posted`
- Maintain reference between draft and posted versions

## Report Finalization Process
- Remove all metadata comments (draft status, user feedback, etc.)
- Clean up content formatting for peer consumption
- Preserve core information and structure
- Apply final content filters based on user feedback
- Ensure professional tone and appropriate detail level

## Final Report Format
```markdown
# Report - [Date]

[Clean, finalized content without internal metadata]

## Key Information
[Relevant information for the peer]

## Opportunities
[Specific opportunities or connections]

## Updates
[Network updates and insights]
```

## Process
Find approved reports → Verify peers exist → Clean content → Generate timestamp → Copy to outgoing directory → Update status → Confirm success

## Posting Workflow
1. Identify approved draft reports
2. Extract target peer directory name and validate peer exists in `peers/` directory
3. Create clean final version of report content
4. Generate timestamp for final report filename
5. Copy to `peers/{ALIAS}-{PUBLIC_KEY}/outgoing/{TIMESTAMP}.md`
6. Update draft report status to `posted` with reference to final location
7. Log posting action for user review

## Status Tracking
- Mark original draft as `STATUS: posted`
- Add reference to final report location
- Maintain audit trail of what was posted when
- Allow user to review posting history

## Success Response
On success: "Posted [number] reports: [details of each posted report by peer]"

## Error Cases
- If no approved reports exist, inform user and suggest reviewing draft reports
- If target peer doesn't exist in peers/ directory, warn user and skip that report
- If outgoing directory doesn't exist, create it automatically
- If file write operation fails, note error and continue with other reports
- If report content is empty or corrupted, warn user and skip

## Confirmation and Review
- Show summary of reports to be posted before execution
- List target peers and report summaries
- Allow user to confirm before posting
- Provide posting summary after completion

## Examples
- User says "post-reports" → Post all approved draft reports to respective peers
- User says "post-reports for alice" → Post only approved reports targeting alice
- User says "post-reports recent" → Post approved reports from last 7 days
- User says "post-report draft_report_for_alice_20241129" → Post specific report
- System shows: "Posting 3 reports: 1 for alice, 2 for bob. Continue? (y/n)"
- After posting: "Posted 3 reports successfully. alice: 1 report, bob: 2 reports."
