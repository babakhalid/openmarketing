---
title: Persona & Business
description: Evidence-grounded user, buyer, champion, and evaluator profiles with business context.
section: Workflows
order: 8
---

`/persona <slug>` builds 1–3 actionable role profiles grounded in shared context, customer evidence, and market research.

## What it does

1. Reads the context, customer-research, and market-research artifacts when present.
2. Distinguishes user, champion, decision maker, financial buyer, and technical evaluator where the buying process requires it.
3. Captures jobs, pains, triggers, objections, trusted proof, and attention venues for each supported profile.
4. Includes the strongest verbatim voice-of-customer quotes with source paths or URLs; it does not fill an arbitrary quote quota.
5. Labels every important field as evidenced, user-supplied, inferred, or unknown.

## Output

`outputs/campaigns/<slug>-persona.md` — consumed by `/plan`, `/psychology`, `/creative`.

## Source

Canonical prompt: [`prompts/persona.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/persona.md).
