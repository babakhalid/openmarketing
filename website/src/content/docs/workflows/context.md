---
title: Marketing Context
description: Maintain the shared product, customer, positioning, offer, funnel, proof, and constraint record.
section: Workflows
order: 2
---

`/context <product-or-slug>` creates or updates the canonical input used by every substantial workflow.

## Context model

The artifact covers product and stage, business model, customer roles and jobs, pains and alternatives, differentiation, positioning, offer, objections, proof, customer language, brand rules, funnel and activation, data sources, channels, capacity, budget constraints, goals, and approval boundaries.

OpenMarketing separates sourced evidence, direct user assertions, and hypotheses. Substantive revisions are versioned with a small changelog so later decisions can be traced to the context that produced them.

## Output

`outputs/campaigns/<slug>-context.md`.

## Source

Canonical prompt: [`prompts/context.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/context.md).
