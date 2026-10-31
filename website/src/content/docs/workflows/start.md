---
title: Start
description: Establish shared context, assess readiness, and choose one justified next action.
section: Workflows
order: 1
---

`/start <product-or-startup>` is the front door for a technical founder who does not know which marketing task should happen first.

## What it does

1. Derives a short workspace slug and resumes an existing context artifact when present.
2. Drafts context from available product/repository material and asks only for gaps that could change the first decision.
3. Assesses context, problem, message, conversion, measurement, and scale readiness as ready, partial, blocked, or unknown.
4. Identifies the current binding constraint.
5. Recommends one primary workflow, with at most two alternatives and the condition that would make either preferable.

The recommendation explains why it matters now, what it produces, how completion is judged, and what decision it unlocks. Missing evidence creates a small validation step, not false certainty.

## Output

`outputs/campaigns/<slug>-context.md` — a versioned source of truth plus readiness snapshot and next recommendation.

## Source

Canonical prompt: [`prompts/start.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/start.md).
