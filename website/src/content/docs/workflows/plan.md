---
title: Marketing Plan
description: Sequenced 90-day full-funnel plan with owners, dependencies, measurement, approvals, and stop criteria.
section: Workflows
order: 7
---

`/plan <slug>` converts an approved strategy into an executable 90-day plan. It reads shared context, diagnosis, strategy, customer/market research, and persona evidence before sequencing work.

## What it produces

- Business goal, startup stage, current constraint, approved bets, capacity, and budget constraints.
- Relevant acquisition, activation, retention, referral, and revenue work.
- A sequence of unblock → foundation → execute → learn, with unresolved prerequisites made visible.
- Owner, dependency, deliverable, signal, decision rule, and approval gate for every work item.
- Instrumentation and baselines before experiments that depend on them.
- Explicit non-goals, risks, stop criteria, and strategy-revision triggers.

Paid acquisition is an optional specialist branch. It is included only when message, conversion, measurement, and budget readiness are documented.

## Output

`outputs/campaigns/<slug>-plan.md`.

## Source

Canonical prompt: [`prompts/plan.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/plan.md).
