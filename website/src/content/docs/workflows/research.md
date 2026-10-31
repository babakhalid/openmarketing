---
title: Market Research
description: Source-grounded market brief covering alternatives, demand, category movement, distribution, and constraints.
section: Workflows
order: 4
---

`/research <topic-or-slug>` produces a cited decision brief that downstream diagnosis, strategy, persona, and planning workflows consume. It reads the shared context first when one exists.

## What it does

1. States the decision the research must support and clarifies the offer, segment, and geography only when necessary.
2. Maps direct competitors, substitute approaches, internal/DIY alternatives, and the cost of doing nothing.
3. Gathers customer and demand signals, category changes, constraints, and distribution evidence across relevant owned, earned, partner, community, search, social, product-led, outbound, and paid channels.
4. Prefers primary and recent sources, preserves dates and URLs, and separates observations from inferences.
5. Uses the `market-researcher` subagent for independent evidence batches when the scope is large.

## Output schema

```markdown
# Market Research: <topic>

## Offer & Segment
## Alternatives Landscape
## Customer and Demand Signals
## Category Movement
## Distribution Evidence
## Constraints
## Implications
## Open Questions
## Sources
```

Quantitative and non-obvious claims link to a source URL or named artifact. Reviews and forum samples remain labeled as directional evidence, not population-wide truth.

## Source

Canonical prompt: [`prompts/research.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/research.md).
