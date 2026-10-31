---
title: Weekly Review
description: Validate full-funnel evidence, capture learning, make operating decisions, and choose the next action.
section: Workflows
order: 14
---

`/weekly-review <slug> [--period <date-range>]` is the default recurring operating review.

## Review sequence

1. Check the window, freshness, event definitions, attribution caveats, and raw evidence paths.
2. Compare evidence with plan-defined decision rules.
3. Summarize relevant acquisition, activation, retention, referral, and revenue changes.
4. Separate signal, possible noise, and tracking defects.
5. Record shipped work, learning, failures, and changed assumptions.
6. Decide continue, change, stop, or investigate for each active bet.
7. Choose one primary next action with an owner and definition of done.

The review stages external actions for approval; it does not publish, send, spend, or change live systems.

## Output

`outputs/reports/<slug>-weekly-<YYYY-MM-DD>.md`.

## Source

Canonical prompt: [`prompts/weekly-review.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/weekly-review.md).
