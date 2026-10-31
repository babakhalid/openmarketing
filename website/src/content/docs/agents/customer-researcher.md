---
title: Customer Researcher
description: Synthesizes first-party and proxy voice-of-customer evidence with quote-level provenance.
section: Agents
order: 2
---

The `customer-researcher` subagent analyzes supplied interviews, surveys, sales/support/churn material, or gathers permitted public customer evidence for a defined decision.

Hard rules:

- Never fabricate or lightly paraphrase text presented as a verbatim quote.
- Attach source path or URL, date when available, segment signal, and context to important evidence.
- Keep first-party customer evidence separate from competitor-customer and community proxy evidence.
- Report frequency only within the reviewed evidence set.
- Explain confidence from source independence, consistency, recency, segment fit, and bias.
- Preserve contradictions and minimize personal data.

Output: research question, evidence inventory, limitations, themes, quote bank, jobs/triggers/objections/alternatives, confidence and contradictions, implications, gaps, and sources.

Source: [`.openmarketing/agents/customer-researcher.md`](https://github.com/babakhalid/openmarketing/blob/main/.openmarketing/agents/customer-researcher.md).
