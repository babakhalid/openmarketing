---
title: Marketing Report
description: Decision-focused full-funnel report with verified outcomes, learning, coverage gaps, and next action.
section: Workflows
order: 13
---

`/report <slug>` reconstructs the through-line from objective to decisions, shipped work, observed outcomes, learning, and the next decision. It reads raw evidence paths referenced by tracking reports and keeps missing coverage visible.

## Output structure

```markdown
# Marketing Report: <topic>

## Executive Summary
## Objective & Plan Recap
## Work Shipped
## Verified Outcomes
## Full-Funnel View
## Learning
## Continue / Change / Stop / Investigate Decisions
## Primary Next Action
## Coverage Gaps
## Sources and Raw Inputs
```

Missing funnel stages are marked `No usable data available` rather than filled with assumptions. Comparisons use plan-defined decision rules, not hindsight targets.

## PDF export

Chain `/preview` on the saved Markdown file for a polished PDF.

## Output

`outputs/reports/<slug>-report.md`.

## Source

Canonical prompt: [`prompts/report.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/report.md).
