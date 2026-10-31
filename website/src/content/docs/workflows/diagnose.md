---
title: Diagnose
description: Identify the startup's binding full-funnel bottleneck and readiness gaps from saved evidence.
section: Workflows
order: 5
---

`/diagnose <slug>` turns context, research, plans, results, and recent reviews into a stage-aware diagnosis.

It evaluates six readiness gates and maps known evidence across acquisition, activation, retention, referral, and revenue. Unknown data stays unknown. Before comparing metrics, the workflow checks freshness, definitions, attribution, and provenance.

The result names one binding constraint and one primary action. Alternatives are included only when a specific missing fact or condition could make them preferable.

## Output

`outputs/campaigns/<slug>-diagnosis.md` — evidence, readiness, bottleneck, prerequisites, owner, definition of done, expected learning, risks, and approval needs.

## Source

Canonical prompt: [`prompts/diagnose.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/diagnose.md).
