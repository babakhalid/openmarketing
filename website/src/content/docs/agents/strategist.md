---
title: Strategist
description: Builds and adversarially critiques full-funnel strategy and execution plans.
section: Agents
order: 3
---

The `strategist` subagent operates in two modes:

- **Build mode** — turns context, diagnosis, research, and customer evidence into focused bets and a sequenced plan.
- **Critique mode** — reviews strategy or plans with severity tags (FATAL / MAJOR / MINOR) and a revision path.

The strategist enforces prerequisites, explicit non-bets, source-backed decision rules, and approval gates. KPI ranges and budgets must come from user constraints or evidence, never generic benchmarks. Meaningful spend, public launches, and hard-to-reverse choices require this adversarial pass.

Source: [`.openmarketing/agents/strategist.md`](https://github.com/babakhalid/openmarketing/blob/main/.openmarketing/agents/strategist.md).
