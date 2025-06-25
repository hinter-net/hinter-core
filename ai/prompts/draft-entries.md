# `draft-entries`

## Description
Analyzes existing user entries (from `entries/` and `entries/pinned/`) to generate new, AI-authored entries. These AI-generated entries can highlight noteworthy patterns or trends, suggest actions, track information, or summarize content based on the themes and information present in the user's existing data.

## Invocation / Arguments
*   **Invocation**: User typically says: `draft-entries [focus_area]`
    *   Example: `draft-entries` (for a general analysis)
    *   Example: `draft-entries summarize project X updates`
    *   Example: `draft-entries look for trends in communication with contact Y`
*   **Parameters**:
    *   `{FOCUS_AREA}` (optional):
        *   Keywords or phrases indicating the type of analysis or entries the user wants (e.g., "summarize X", "track Y", "identify patterns in Z").
        *   If not provided, the AI performs a general analysis, looking for salient themes, actionable items, or notable patterns from the entries.

## Core Logic / Procedure
1.  **Data Retrieval**:
    *   Execute `ai/tools/echo-entries.sh --type unpinned > .clinerules/unpinned-entries.md` to get the full content of all unpinned entries from `entries/`.
    *   The generated file will be automatically available in your context without needing to explicitly read it.
2.  **Contextual Analysis**:
    *   If `entries/` is empty, trigger "No Entries for Analysis" error.
    *   Analyze all ingested entries to understand their primary content, themes, entities, and any explicit or implicit tasks or information flows.
    *   As part of this analysis, identify any notable patterns, trends, or shifts in the data that might be non-obvious to the user (e.g., changes in topic frequency, sentiment shifts if detectable, recurring unaddressed items).
    *   Pay special attention to pinned entries for overarching user priorities.
3.  **Determine Focus & Nature of AI-Generated Entries**:
    *   If `{FOCUS_AREA}` is provided, prioritize analysis and generation related to that area.
    *   If `{FOCUS_AREA}` is not provided, the AI should identify potential areas for insightful or helpful AI-generated entries. This can include:
        *   **Pattern Highlighting**: Entries that describe a noteworthy pattern or trend observed in the data.
        *   **Actionable Suggestions**: If entries indicate pending tasks, communications, or decisions.
        *   **Information Summarization/Synthesis**: If entries contain dense information that could be usefully summarized or collated.
        *   **Outcome/Status Tracking**: For ongoing processes or items needing follow-up.
4.  **Content Generation for Each Identified AI-Entry**:
    *   For each identified area warranting an AI-generated entry:
        *   Formulate a clear title reflecting its purpose.
        *   Compose the content (summary, suggested action, pattern description, etc.), adapting style and structure to the task.
        *   Provide context or evidence from source entries where appropriate.
        *   Adhere to the "AI-Generated Entry Format" specified below, including the user feedback section.
5.  **File Creation**:
    *   For each generated AI-entry:
        *   Determine the current UTC timestamp in `YYYYMMDDHHMMSS` format.
        *   Construct the filename: `{TIMESTAMP}_ai_[type].md` (e.g., `20250530170000_ai_summary.md`). The `[type]` should be a short keyword reflecting the entry's purpose (e.g., `summary`, `action`, `insight`, `pattern`).
        *   Save the generated content to this new file in the `entries/` directory.
        *   If file creation fails, trigger "File Creation Failed" error for that specific entry but attempt to continue with others.
6.  **Confirm Success**: After attempting to generate and save all identified AI-entries, provide a summary success output.

## AI-Generated Entry Format (Template to be filled by AI)
```markdown
<!-- AI-GENERATED: [TYPE: e.g., Summary, ActionSuggestion, PatternInsight, StatusTracker] -->
<!-- ANALYSIS_DATE: [YYYYMMDDHHMMSS of AI analysis] -->
<!-- CONFIDENCE: [High/Medium/Low, based on clarity of information/pattern] -->
<!-- REFS: [List of source YYYYMMDDHHMMSS.md entry filenames if applicable] -->

# [AI-Generated Title Describing the Entry's Purpose]

## AI Observation / Suggestion / Summary
[The main body of the AI-generated content. This could be a description of a pattern, a text summary, a suggested action, etc.]

## Supporting Details / Evidence (If applicable)
[Specific details or references from source entries that support the content above.]

## User Feedback & Notes
<!--
    User, please add your comments here:
    - Do you agree with this observation/suggestion? Why or why not?
    - Is this type of AI-generated entry useful?
    - Any other notes for future AI learning?
-->
```

## User Interaction & Confirmation
*   The AI responds with the generated entries or an error/status message.
*   User provides feedback by editing the AI-generated entries directly, especially within the "User Feedback & Notes" section.

## Success Output
*   "Drafted {N} new AI-generated entries:
    *   `entries/{FILENAME_1}` (Purpose: {purpose_1})
    *   `entries/{FILENAME_2}` (Purpose: {purpose_2})
    *   ..."
*   If no significant insights or actionable items found: "Analyzed entries, but no new AI-generated entries were drafted at this time."

## Error Handling & Responses
*   **No Entries for Analysis**: "Error: The `entries/` directory is empty. No analysis possible to draft entries."
*   **Unclear Task/Patterns (Low Confidence)**: If analysis yields only low-confidence interpretations, the AI might state: "Generated some entries based on tentative observations. Please review them carefully and provide feedback."
*   **File Creation Failed**: "Error: Failed to save AI-generated entry `{FILENAME}`. Please check permissions or disk space."

## AI Learning
*   The AI (or a supervising system) should be able to process the "User Feedback & Notes" section from edited entries.
*   This feedback helps refine the AI's understanding of what constitutes a valuable insight, useful suggestion, or relevant pattern for the user, thereby improving future `draft-entries` operations.

## Dependencies
*   Relies heavily on `ai/tools/echo-entries.sh` piped to `.clinerules/unpinned-entries.md` to access the full content of all user entries.
*   Requires AI analytical capabilities adaptable to the domain reflected in the user's entries, including pattern recognition and summarization.
