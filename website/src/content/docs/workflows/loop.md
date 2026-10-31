---
title: Marketing Loop
description: Design a safe recurring process with a signal, durable state, self-checks, escalation, and kill switch.
section: Workflows
order: 15
---

`/loop <slug> <purpose>` converts a proven recurring task into a bounded operating loop.

## Required contract

Every loop defines cadence, action condition, purpose, inputs and capabilities, bounded run sequence, self-check, state and idempotency, stop/escalation behavior, output, and a manual kill switch. Stale, contradictory, or missing data stops the run rather than creating artificial continuity.

Analysis, diffs, scoring, drafts, and staged recommendations may run unattended. Sending, publishing, spending, deleting, external uploads, and live-system changes remain human-gated. OpenMarketing schedules a loop only when the user explicitly asks for recurrence.

Start with measurement integrity and one weekly review. Automate another process only after the manual version has produced useful decisions consistently.

## Output

- Specification: `outputs/campaigns/<slug>-loop-<loop-name>.md`
- Operational state: `outputs/reports/.notes/<slug>-loop-<loop-name>.json`

## Source

Canonical prompt: [`prompts/loop.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/loop.md).
