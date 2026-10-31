---
title: Track & Refine
description: Pull and verify Meta Ads evidence, compare it with plan-defined rules, and stage refinements.
section: Workflows
order: 12
---

`/track <slug> [--window <days>]` is the paid-acquisition measurement branch. It produces an operational report anchored to raw Meta responses and the active plan's definitions.

## What it does

1. Pulls insights via `meta_insights`, `meta_list_ads`, `meta_list_adsets` over the window (default 7 days).
2. Validates the reporting window, attribution setting, event definitions, currency, freshness, and entity IDs.
3. Compares results only with plan-defined KPI thresholds and decision rules; it does not introduce universal cutoffs after the fact.
4. Surfaces possible fatigue, underperformance, and scaling signals with the exact evidence and uncertainty attached.
5. Pattern-analyzes wins and losses by angle and lever, then stages specific refinements for a decision.

## Authorization

Pause, scale, and budget changes are recommendations by default. The `tracker` applies changes only after explicit, bounded authorization. Raw insights JSON is saved to `outputs/reports/.notes/<slug>-insights-<date>.json` for audit.

## Output

`outputs/reports/<slug>-tracking-<YYYY-MM-DD>.md`.

## Source

Canonical prompt: [`prompts/track.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/track.md).
