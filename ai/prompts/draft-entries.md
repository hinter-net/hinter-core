# `draft-entries`
You are managing a file-based entry system with AI-powered network analysis. When a user asks you to draft entries or when you proactively identify opportunities:

## Overview
Use AI analysis of existing entries to generate strategic insights, track outcomes, analyze network patterns, and suggest proactive actions. This workflow covers AI-generated content that helps users maintain and optimize their personal networks.

## AI Analysis Capabilities
- **Outcome tracking**: Generate entries to track results of connections, introductions, and opportunities
- **Network analysis**: Identify key relationships, patterns, and strategic insights
- **Network optimization**: Suggest gaps to fill, relationships to strengthen, or new connections to pursue
- **Strategic insights**: Generate observations about network health, opportunities, and priorities
- **Proactive suggestions**: Identify actions the user should consider based on network patterns

## Entry Creation Process
- Analyze all entries in `entries/` and `entries/pinned/` directories
- Identify patterns, relationships, and opportunities
- Generate new entries with timestamp-based filenames: `YYYYMMDDHHMMSS_ai_[type].md`
- Include metadata identifying entries as AI-generated
- Focus on actionable insights and strategic observations

## Types of AI-Generated Entries

### Outcome Tracking Entries
Track results of networking activities:
```markdown
<!-- AI-GENERATED OUTCOME TRACKING -->
<!-- REFS: [related entry timestamps] -->

# Outcome Tracking: Introduction between Alice and Bob

Following up on the introduction made between Alice (alice-bc8064...) and Bob (bob-a6e1fa...) regarding the blockchain meetup opportunity.

**Original connection**: 20250516143000.md
**Introduction made**: 20250518
**Expected outcome**: Bob speaks at Alice's meetup, Alice gets React expertise

**Status to track**:
- Did Bob attend the meetup?
- Was the presentation successful?
- Did this lead to ongoing collaboration?
- Should similar introductions be prioritized?

**Next check**: Follow up in 2 weeks
```

### Network Analysis Entries
Strategic observations about network patterns:
```markdown
<!-- AI-GENERATED NETWORK ANALYSIS -->
<!-- ANALYSIS DATE: [current_timestamp] -->

# Network Analysis: Key Relationship Patterns

Based on analysis of recent entries, several strategic patterns emerge:

**Alice (alice-bc8064...) - High Value Connector**
- Appears in 8 entries over past month
- Consistently provides valuable introductions
- Strong technical network in blockchain/React space
- Recommendation: Prioritize maintaining this relationship

**Bob (bob-a6e1fa...) - Emerging Opportunity**
- Technical skills align with multiple network needs
- Actively seeking community involvement
- Could become valuable long-term connector
- Recommendation: Invest in developing this relationship

**Network Gaps Identified**:
- Limited legal counsel connections
- Weak presence in healthcare sector
- Missing senior executive relationships in target industries

**Strategic Priorities**:
1. Strengthen relationship with Alice through regular value exchange
2. Help Bob establish himself in the community
3. Actively seek legal and healthcare connections
```

### Network Optimization Entries
Suggestions for network development:
```markdown
<!-- AI-GENERATED NETWORK OPTIMIZATION -->
<!-- PRIORITY: high -->

# Network Optimization: Legal Counsel Gap

Analysis of recent entries reveals a significant gap in legal expertise within the network.

**Evidence of need**:
- 3 recent conversations about contract negotiations (entries: 20250515, 20250518, 20250520)
- Multiple peers asking for legal referrals
- Missed opportunity to help Alice with startup legal issues

**Recommended actions**:
1. Attend local bar association networking events
2. Ask existing network for legal counsel introductions
3. Consider joining entrepreneur legal meetups
4. Leverage university alumni network for legal connections

**Target profile**:
- Startup/tech-focused attorney
- Experience with blockchain/AI legal issues
- Well-connected in local business community
- Willing to provide strategic advice, not just transactional work

**Timeline**: Prioritize over next 30 days
```

## Processing Rules
- Analyze entries chronologically to identify trends and patterns
- Cross-reference peer interactions to identify relationship dynamics
- Look for gaps between what the network needs and what it provides
- Generate actionable insights rather than just observations
- Prioritize suggestions based on potential impact and feasibility

## Process
Analyze entries → Identify patterns → Select entry type → Generate content → Create timestamped file → Confirm success

## AI-Generated Entry Format
```markdown
<!-- AI-GENERATED: [type] -->
<!-- ANALYSIS_DATE: [current_timestamp] -->
<!-- CONFIDENCE: [high/medium/low] -->
<!-- REFS: [related entry timestamps] -->

# [Title describing the insight or suggestion]

[Detailed analysis and recommendations]

**Evidence**: [Supporting data from entries]
**Recommendation**: [Specific actionable steps]
**Timeline**: [Suggested timeframe for action]
**Success metrics**: [How to measure if this was valuable]
```

## User Interaction
- User can request specific types of analysis: "draft entries about network gaps"
- AI can proactively suggest when patterns emerge: "I notice you haven't tracked the outcome of the Alice-Bob introduction"
- User provides feedback by editing AI-generated entries
- System learns from which suggestions user acts on vs. ignores

## Success Response
On success: "Created new AI-generated entry: entries/YYYYMMDDHHMMSS_ai_[type].md focusing on [focus area]"

## Error Cases
- If entries/ directory is empty, inform user no analysis possible
- If patterns are unclear, generate low-confidence suggestions
- If analysis seems repetitive, focus on new insights only
- If user consistently ignores certain types of suggestions, reduce frequency
- If file creation fails, note the error and stop

## Examples
- User says "draft entries about my network" → Generate network analysis and optimization suggestions
- User says "track outcomes from last week" → Create outcome tracking entries for recent activities
- User says "what should I focus on?" → Generate strategic priority entries
- AI proactively suggests: "You haven't followed up on the introduction you made between Alice and Bob"
- User says "analyze my relationship with alice" → Generate detailed relationship analysis entry
